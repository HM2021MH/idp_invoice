package org.um5.ensias.backendnew.Services;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

@Service
public class OcrService {

    /**
     * Resolve tesseract binary path:
     * - In Docker (Linux): just "tesseract" from PATH
     * - On Windows dev machine: falls back to the default install path
     */
    private String getTesseractPath() {
        // If running on Windows locally, use the full path
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            return "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
        }
        // Linux / Docker: tesseract is on PATH
        return "tesseract";
    }

    /**
     * Extract text from image or PDF file.
     * For PDFs, only the first page is processed.
     */
    public String extractText(File file) throws Exception {
        String filename = file.getName().toLowerCase();
        if (filename.endsWith(".pdf")) {
            return extractTextFromPDFFirstPage(file);
        } else {
            return extractTextFromImage(file);
        }
    }

    /**
     * Extract text from image using Tesseract OCR.
     * Uses "stdout" as output so no temp .txt file is needed.
     */
    private String extractTextFromImage(File imageFile) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(
                getTesseractPath(),
                imageFile.getAbsolutePath(),
                "stdout",
                "-l", "eng"
        );

        pb.redirectErrorStream(false);
        Process process = pb.start();

        String result = new String(process.getInputStream().readAllBytes());
        String error  = new String(process.getErrorStream().readAllBytes());
        int exitCode  = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("Tesseract OCR failed (exit " + exitCode + "): " + error);
        }

        return result.trim();
    }

    /**
     * Extract text from the first page of a PDF only.
     * Tries direct text extraction first; falls back to OCR for scanned pages.
     */
    private String extractTextFromPDFFirstPage(File pdfFile) throws Exception {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            if (document.getNumberOfPages() == 0) {
                throw new RuntimeException("PDF has no pages");
            }

            // Try direct text extraction for first page only
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(1);
            String directText = stripper.getText(document);

            // If direct extraction yields substantial text, use it
            if (directText != null && directText.trim().length() > 50) {
                return directText.trim();
            }

            // First page is likely scanned — use OCR
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

    /**
     * Get the number of pages in a PDF.
     */
    public int getPdfPageCount(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            return document.getNumberOfPages();
        }
    }

    public boolean isPdf(File file) {
        return file != null && file.getName().toLowerCase().endsWith(".pdf");
    }

    /**
     * Check if Tesseract is available on the current system.
     */
    public boolean isTesseractAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder(getTesseractPath(), "--version");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }
}