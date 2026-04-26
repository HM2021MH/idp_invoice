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
     * Extract text from image or PDF file
     * For PDFs, only the first page is processed
     * @param file The file to process (image or PDF)
     * @return Extracted text
     * @throws Exception if extraction fails
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
     * Extract text from image using Tesseract OCR
     * @param imageFile The image file
     * @return Extracted text
     * @throws Exception if OCR fails
     */
    private String extractTextFromImage(File imageFile) throws Exception {
        String tesseractPath = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe";
        ProcessBuilder pb = new ProcessBuilder(
                tesseractPath,
                imageFile.getAbsolutePath(),
                "stdout",
                "-l", "eng"
        );

        Process process = pb.start();
        String result = new String(process.getInputStream().readAllBytes());
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            String error = new String(process.getErrorStream().readAllBytes());
            throw new RuntimeException("Tesseract OCR failed: " + error);
        }

        return result.trim();
    }

    /**
     * Extract text from first page of PDF only
     * Combines direct text extraction with OCR for scanned pages
     * @param pdfFile The PDF file
     * @return Extracted text from first page
     * @throws Exception if extraction fails
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
            } else {
                // First page is likely scanned - use OCR
                PDFRenderer renderer = new PDFRenderer(document);

                // Render first page to image (300 DPI for good quality)
                BufferedImage pageImage = renderer.renderImageWithDPI(0, 300);

                // Save temporary image
                File tempImage = File.createTempFile("pdf_first_page", ".png");
                ImageIO.write(pageImage, "png", tempImage);

                try {
                    // Extract text from page image
                    String pageText = extractTextFromImage(tempImage);
                    return pageText != null ? pageText.trim() : "";
                } finally {
                    // Clean up temporary image
                    tempImage.delete();
                }
            }
        }
    }

    /**
     * Get the number of pages in a PDF
     * @param pdfFile The PDF file
     * @return Number of pages
     * @throws IOException if file cannot be read
     */
    public int getPdfPageCount(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            return document.getNumberOfPages();
        }
    }

    /**
     * Check if a file is a PDF
     * @param file The file to check
     * @return true if PDF, false otherwise
     */
    public boolean isPdf(File file) {
        return file != null && file.getName().toLowerCase().endsWith(".pdf");
    }

    /**
     * Check if Tesseract is available
     * @return true if Tesseract is installed and accessible
     */
    public boolean isTesseractAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("tesseract", "--version");
            Process process = pb.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }
}