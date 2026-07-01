package org.um5.ensias.backendnew.Services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class OcrService {

    public enum Engine { DOCLING, TESSERACT }

    private static final Engine DEFAULT_ENGINE = Engine.TESSERACT;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Extract text/Markdown from an image or PDF using the default engine (Docling).
     * Automatically falls back to Tesseract if Docling is unavailable or fails.
     */
    public String extractText(File file) throws Exception {
        return extractText(file, DEFAULT_ENGINE);
    }

    /**
     * Extract text/Markdown using the specified engine.
     * When DOCLING fails for any reason, falls back to TESSERACT automatically.
     */
    public String extractText(File file, Engine engine) throws Exception {
        if (engine == Engine.DOCLING) {
            try {
                return extractWithDocling(file);
            } catch (Exception doclingEx) {
                System.err.println("[OcrService] Docling failed (" + doclingEx.getMessage()
                        + "). Falling back to Tesseract.");
                return extractWithTesseract(file);
            }
        }
        return extractWithTesseract(file);
    }

    // -------------------------------------------------------------------------
    // Docling — default engine, returns Markdown
    // -------------------------------------------------------------------------

    /**
     * Run Docling CLI and return Markdown output.
     *
     * Docling does NOT support --stdout; it writes files to an --output directory.
     * Strategy:
     *   1. Create a temp output directory.
     *   2. Run: docling <file> --to markdown --output <tempDir>
     *   3. Read the generated .md file.
     *   4. Delete the temp directory.
     *
     * Install: pip install docling
     */
    private String extractWithDocling(File file) throws Exception {
        Path tempDir = Files.createTempDirectory("docling_out_");
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "docling",
                    file.getAbsolutePath(),
                    "--to", "md",
                    "--output", tempDir.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(false);

            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                throw new RuntimeException(
                        "Cannot launch Docling. Run 'pip install docling' and make sure " +
                                "its Scripts/ folder is on PATH. Cause: " + e.getMessage(), e);
            }

            // Drain streams before waitFor() to prevent pipe-buffer deadlock
            String stdout  = new String(process.getInputStream().readAllBytes());
            String stderr  = new String(process.getErrorStream().readAllBytes());
            int    exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Docling failed (exit " + exitCode + "): " + stderr);
            }

            // Docling mirrors the input filename, e.g. invoice.pdf → invoice.md
            File mdFile = Files.walk(tempDir)
                    .filter(p -> p.toString().endsWith(".md"))
                    .map(Path::toFile)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "Docling succeeded but produced no .md file. stdout=" + stdout));

            String content = Files.readString(mdFile.toPath()).trim();
            System.out.println("content : " + content);
            if (content.isEmpty()) {
                throw new RuntimeException(
                        "Docling produced an empty Markdown file for: " + file.getName());
            }
            return content;

        } finally {
            deleteDirectory(tempDir);
        }
    }

    /** Returns true if the Docling CLI can be launched successfully. */
    public boolean isDoclingAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("docling", "--version");
            pb.redirectErrorStream(true);
            return pb.start().waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Tesseract — fallback engine, returns plain text
    // -------------------------------------------------------------------------

    /** Route to the right Tesseract extractor based on file type. */
    private String extractWithTesseract(File file) throws Exception {
        if (file.getName().toLowerCase().endsWith(".pdf")) {
            return extractTextFromPDFFirstPage(file);
        }
        return extractTextFromImage(file);
    }

    /**
     * Resolve the Tesseract binary path.
     * - Windows: default install location
     * - Linux / Docker: "tesseract" from PATH
     */
    private String getTesseractPath() {
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            return "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
        }
        return "tesseract";
    }

    /**
     * Run Tesseract on an image file and return plain text via stdout.
     * "stdout" as the output base tells Tesseract to write to standard output directly.
     */
    private String extractTextFromImage(File imageFile) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                "tesseract",
                imageFile.getAbsolutePath(),
                "stdout",
                "-l", "eng"
        );
        pb.redirectErrorStream(false);
        Process process = pb.start();

        String result  = new String(process.getInputStream().readAllBytes());
        String error   = new String(process.getErrorStream().readAllBytes());
        int    exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Tesseract OCR failed (exit " + exitCode + "): " + error);
        }
        return result.trim();
    }

    /**
     * Extract text from the first page of a PDF (Tesseract path).
     * Tries direct text extraction first; falls back to OCR for scanned pages.
     */
    private String extractTextFromPDFFirstPage(File pdfFile) throws Exception {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            if (document.getNumberOfPages() == 0) {
                throw new RuntimeException("PDF has no pages");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1);
            String directText = stripper.getText(document);

            if (directText != null && directText.trim().length() > 50) {
                return directText.trim();
            }

            // First page appears scanned — render and OCR it
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage pageImage = renderer.renderImageWithDPI(0, 300);

            File tempImage = File.createTempFile("pdf_first_page_", ".png");
            ImageIO.write(pageImage, "png", tempImage);
            try {
                String pageText = extractTextFromImage(tempImage);
                return pageText != null ? pageText.trim() : "";
            } finally {
                tempImage.delete();
            }
        }
    }

    /** Returns true if the Tesseract CLI can be launched successfully. */
    public boolean isTesseractAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("tesseract", "--version");
            pb.redirectErrorStream(true);
            return pb.start().waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // PDF utilities
    // -------------------------------------------------------------------------

    /** Return the number of pages in a PDF. */
    public int getPdfPageCount(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            return document.getNumberOfPages();
        }
    }

    public boolean isPdf(File file) {
        return file != null && file.getName().toLowerCase().endsWith(".pdf");
    }

    // -------------------------------------------------------------------------
    // Diagnostics
    // -------------------------------------------------------------------------

    public void logEngineStatus() {
        System.out.println("[OcrService] Docling available   : " + isDoclingAvailable());
        System.out.println("[OcrService] Tesseract available : " + isTesseractAvailable());
        System.out.println("[OcrService] Default engine      : " + DEFAULT_ENGINE);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Recursively delete a directory and all its contents. */
    private void deleteDirectory(Path dir) {
        try {
            Files.walk(dir)
                    .sorted(java.util.Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        } catch (IOException e) {
            System.err.println("[OcrService] Warning: could not delete temp dir " + dir + ": " + e.getMessage());
        }
    }
}