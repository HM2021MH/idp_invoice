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

        // ✅ Debug
        System.out.println("📦 FINAL SCHEMA USED:\n" + schemaToUse);

        return String.format("""
            You are an AI specialized in invoice data extraction.

            CRITICAL RULES:

            1. EXACT EXTRACTION ONLY:
               - Copy values EXACTLY as they appear
               - DO NOT calculate anything

            2. STRICT SCHEMA RULE:
               - ONLY use fields defined in the schema
               - DO NOT add fields outside schema

            3. FIELD INCLUSION:
               - Include a field ONLY if:
                 (a) it exists in OCR text
                 (b) it exists in schema

            4. OUTPUT FORMAT:
               - Return ONLY raw JSON
               - No markdown
               - Start with { and end with }

            SCHEMA:
            %s

            OCR TEXT:
            <
            %s
            >>>

            OUTPUT: Raw JSON only
            """, schemaToUse, ocrText);
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