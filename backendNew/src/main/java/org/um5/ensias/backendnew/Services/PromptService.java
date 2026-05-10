package org.um5.ensias.backendnew.Services;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class PromptService {

    private static final String GLOBAL_SCHEMA = """
    {
      "invoice_number": "string",
      "invoice_date": "string (format: YYYY-MM-DD or as found)",
      "due_date": "string (format: YYYY-MM-DD or as found)",
      "supplier": {
        "name": "string",
        "address": "string",
        "tax_id": "string",
        "phone": "string",
        "email": "string"
      },
      "customer": {
        "name": "string",
        "address": "string",
        "tax_id": "string",
        "phone": "string",
        "email": "string"
      },
      "line_items": [
        {
          "sku": "string",
          "description": "string",
          "quantity": "number",
          "unit_price": "number",
          "total": "number"
        }
      ],
      "subtotal": "number",
      "net": "number",
      "tax_rate": "number (percentage)",
      "tax_amount": "number",
      "total": "number",
      "currency": "string",
      "payment_terms": "string",
      "notes": "string"
    }
    """;

    public String buildExtractionPrompt(String ocrText, String schema) {

        String schemaToUse = GLOBAL_SCHEMA;

        // ✅ Parse incoming schema safely
        if (schema != null && !schema.isBlank()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode jsonNode = mapper.readTree(schema);

                schemaToUse = mapper
                        .writerWithDefaultPrettyPrinter()
                        .writeValueAsString(jsonNode);

            } catch (Exception e) {
                System.out.println("⚠️ Invalid schema received. Using default schema.");
            }
        }


        String finalSc = String.format("""
    You are a data extraction engine. Your only job is to extract invoice data into JSON.

    OUTPUT RULES — NON-NEGOTIABLE:
    - Output ONLY a single JSON object
    - Start with { and end with }
    - No markdown, no code fences, no backticks
    - No explanation, no comments
    - No duplicate keys (if a field appears twice, keep only the first)
    - All string values must have newlines escaped as \\n
    - If a field value is missing from the text, use null (not empty string "")
    - Numbers must be numeric (not strings): "total": 980.00 not "total": "980.00"

    EXTRACTION RULES:
    - Copy values EXACTLY as they appear in the OCR text
    - Do NOT calculate, infer, or guess any value
    - Only include fields that are defined in the SCHEMA below
    - Only include a field if its value is explicitly present in the OCR text

    SCHEMA (follow this structure exactly):
    %s

    OCR TEXT:
    %s

    JSON OUTPUT:
    """, schemaToUse, ocrText);
        System.out.println("📦 FINAL SCHEMA USED:\n" + finalSc);

        return finalSc;
    }


//    // Recherche d'un champ spécifique
//    public String buildFindPrompt(String ocrText, String fieldToFind) {
//        return """
//        You are an AI specialized in searching specific information in documents.
//
//        TASK: Find "%s" in the OCR text below.
//
//        RULES:
//        1. Return ONLY raw JSON - NO markdown blocks
//        2. Extract the EXACT value as written
//        3. DO NOT calculate or derive values
//        4. Format: {"found": true, "value": "exact_value"} or {"found": false}
//
//        OCR TEXT:
//        <
//        %s
//        >>>
//
//        OUTPUT: Raw JSON only.
//        """.formatted(fieldToFind, ocrText);
//    }
//
//    // Description du document
//    public String buildDescriptionPrompt(String ocrText) {
//        return """
//        You are an AI specialized in document analysis.
//
//        TASK: Analyze the document from the OCR text below.
//
//        RULES:
//        1. Return ONLY raw JSON - NO markdown blocks
//        2. Identify document type, language, quality
//        3. List main sections found
//
//        Structure:
//        {
//          "document_type": "string",
//          "language": "string",
//          "quality": "string",
//          "main_sections": ["array"],
//          "summary": "string"
//        }
//
//        OCR TEXT:
//        <
//        %s
//        >>>
//
//        OUTPUT: Raw JSON only.
//        """.formatted(ocrText);
//    }
//
//    // Question libre
//    public String buildFreeformPrompt(String ocrText, String userQuery) {
//        return """
//        You are an AI assistant helping users understand documents.
//
//        USER QUESTION: %s
//
//        RULES:
//        1. Answer based ONLY on the OCR text below
//        2. Quote exact values from the document
//        3. DO NOT calculate or derive information
//        4. If not in document, say so clearly
//        5. Be concise and precise
//
//        OCR TEXT:
//        <
//        %s
//        >>>
//
//        Answer naturally:
//        """.formatted(userQuery, ocrText);
//    }
}