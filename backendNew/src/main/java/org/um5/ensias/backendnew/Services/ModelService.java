package org.um5.ensias.backendnew.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class ModelService {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:invoice-extractor}")
    private String defaultModel;

    private static final Map<String, String> MODEL_MAP = Map.of(
            "invoice-extractor", "invoice-extractor"
    );

    private WebClient getWebClient() {
        return WebClient.builder()
                .baseUrl(ollamaBaseUrl)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    public String runModel(String prompt, String modelKey) {
        String modelName = MODEL_MAP.getOrDefault(modelKey, defaultModel);

        // Use HashMap instead of Map.of() so we can add format + options
        Map<String, Object> body = new HashMap<>();
        body.put("model",   modelName);
        body.put("prompt",  prompt);
        body.put("stream",  false);
        body.put("format",  "json");          // Forces valid JSON output
        body.put("options", Map.of(
                "temperature", 0.0,           // No creativity — pure extraction
                "top_p",       1.0,
                "seed",        42             // Reproducible outputs
        ));

        System.out.println("🤖 Calling Ollama at: " + ollamaBaseUrl + " with model: " + modelName);

        try {
            String response = getWebClient()
                    .post()
                    .uri("/api/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .retryWhen(
                            Retry.fixedDelay(5, Duration.ofSeconds(15))
                                    .filter(ex -> !(ex instanceof WebClientResponseException wcre)
                                            || wcre.getStatusCode().is5xxServerError())
                                    .doBeforeRetry(signal ->
                                            System.out.println("⏳ Ollama not ready, retrying... attempt "
                                                    + (signal.totalRetries() + 1) + "/5"))
                    )
                    .timeout(Duration.ofMinutes(5))   // 15 min is way too long
                    .map(res -> {
                        Object r = res.get("response");
                        if (r == null) {
                            throw new RuntimeException("Ollama returned null response field. Full response: " + res);
                        }
                        String raw = r.toString().trim();
                        System.out.println("📦 Raw Ollama response: " + raw);
                        return sanitizeJson(raw);
                    })
                    .block(Duration.ofMinutes(5));

            System.out.println("✅ Ollama responded successfully");
            return response;

        } catch (WebClientResponseException e) {
            System.err.println("❌ Ollama HTTP error: " + e.getStatusCode()
                    + " — " + e.getResponseBodyAsString());
            throw new RuntimeException("Ollama HTTP " + e.getStatusCode()
                    + " for model: " + modelName, e);
        } catch (Exception e) {
            System.err.println("❌ Ollama error: " + e.getMessage());
            throw new RuntimeException("Ollama failed for model: " + modelName
                    + " — " + e.getMessage(), e);
        }
    }

    /**
     * Strip markdown fences and extract the first valid JSON object.
     * Acts as a safety net even when format=json is set.
     */
    private String sanitizeJson(String raw) {
        // Remove markdown code fences
        String cleaned = raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();

        // Extract first { ... } block
        int start = cleaned.indexOf('{');
        int end   = cleaned.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return cleaned.substring(start, end + 1);
        }

        // If no JSON object found, return as-is and let the caller handle it
        System.err.println("⚠️ sanitizeJson: no JSON object found in response");
        return cleaned;
    }

    /**
     * Pre-warm the invoice-extractor model on startup.
     * Uses the correct model name — not qwen2.5:0.5b which isn't in MODEL_MAP.
     */
    @jakarta.annotation.PostConstruct
    public void warmUp() {
        new Thread(() -> {
            try {
                System.out.println("🔥 Pre-warming model: " + defaultModel);
                Thread.sleep(10_000);
                runModel("{}", "invoice-extractor");
                System.out.println("✅ Ollama warm-up complete");
            } catch (Exception e) {
                System.out.println("⚠️ Warm-up failed (non-fatal): " + e.getMessage());
            }
        }, "ollama-warmup-thread").start();  // Named thread for easier debugging
    }
}