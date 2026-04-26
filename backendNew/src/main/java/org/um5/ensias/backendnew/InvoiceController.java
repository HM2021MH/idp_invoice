package org.um5.ensias.backendnew;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.um5.ensias.backendnew.Services.OcrService;
import org.um5.ensias.backendnew.Services.OllamaService;
import org.um5.ensias.backendnew.Services.PromptService;
import org.um5.ensias.backendnew.Services.ResponseCleanerService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/invoice")
@CrossOrigin(origins = "http://localhost:3000")
public class InvoiceController {

    private final OcrService ocrService;
    private final OllamaService ollamaService;
    private final PromptService promptService;
    private final ResponseCleanerService cleanerService;

    private static final List<String> SUPPORTED_MODES = Arrays.asList(
            "extract", "ocr"
    );

    public InvoiceController(OcrService ocrService,
                             OllamaService ollamaService,
                             PromptService promptService,
                             ResponseCleanerService cleanerService) {
        this.ocrService = ocrService;
        this.ollamaService = ollamaService;
        this.promptService = promptService;
        this.cleanerService = cleanerService;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processDocument(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "base64File", required = false) String base64File,
            @RequestParam("mode") String mode,
            @RequestParam(value = "model", defaultValue = "phi3:mini") String model,
            @RequestParam(value = "schema", required = false) String schema
    ) {

        File tempFile = null;

        try {
            // ✅ Validate mode
            if (!SUPPORTED_MODES.contains(mode.toLowerCase())) {
                return badRequest("Invalid mode: " + mode);
            }

            // ✅ Validate file
            if ((file == null || file.isEmpty()) &&
                    (base64File == null || base64File.isEmpty())) {
                return badRequest("No file provided");
            }

            // ✅ Create temp file
            if (file != null && !file.isEmpty()) {
                tempFile = createTempFile(file);
            } else {
                tempFile = createTempFileFromBase64(base64File);
            }

            // ✅ OCR
            String ocrText = ocrService.extractText(tempFile);

            if (ocrText == null || ocrText.trim().isEmpty()) {
                return badRequest("OCR failed");
            }

            // ✅ DEBUG schema
            System.out.println("📥 RAW SCHEMA FROM FRONT:\n" + schema);

            // ✅ Mode switch
            return switch (mode.toLowerCase()) {

                case "extract" -> handleExtractMode(ocrText, schema, model);

                case "ocr" -> handleOcrMode(ocrText);

                default -> badRequest("Unknown mode");
            };

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        } finally {
            if (tempFile != null && tempFile.exists()) {
                tempFile.delete();
            }
        }
    }

    // =========================
    // EXTRACT MODE
    // =========================
    private ResponseEntity<?> handleExtractMode(String ocrText, String schema, String model) {
        try {

            String prompt = promptService.buildExtractionPrompt(ocrText, schema);

            String llmResponse = ollamaService.runModel(prompt, model);

            if (llmResponse == null || llmResponse.trim().isEmpty()) {
                return error("LLM returned empty response");
            }

            String cleaned = cleanerService.cleanJsonResponse(llmResponse);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "mode", "extract",
                    "model", model,
                    "structured_data", cleaned,
                    "raw_ocr", ocrText
            ));

        } catch (Exception e) {
            return error("Extract failed: " + e.getMessage());
        }
    }

    // =========================
    // OCR ONLY
    // =========================
    private ResponseEntity<?> handleOcrMode(String ocrText) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "mode", "ocr",
                "raw_ocr", ocrText
        ));
    }

    // =========================
    // HELPERS
    // =========================

    private File createTempFile(MultipartFile file) throws IOException {
        File temp = File.createTempFile("upload_", ".tmp");
        file.transferTo(temp);
        return temp;
    }

    private File createTempFileFromBase64(String base64) throws IOException {
        byte[] decoded = Base64.getDecoder().decode(base64);

        File temp = File.createTempFile("upload_", ".tmp");

        try (FileOutputStream fos = new FileOutputStream(temp)) {
            fos.write(decoded);
        }

        return temp;
    }

    private ResponseEntity<?> badRequest(String msg) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("success", false, "error", msg));
    }

    private ResponseEntity<?> error(String msg) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", msg));
    }
}