package org.um5.ensias.backendnew.Services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;

@Service
public class OllamaService {

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    private static final Map<String, String> MODEL_MAP = Map.of(
            "phi3:mini",    "phi3:mini",
            "llama3.2:1b",  "llama3.2:1b",
            "qwen2.5:0.5b", "qwen2.5:0.5b"
    );


    private WebClient getWebClient() {
        return WebClient.builder()
                .baseUrl(ollamaBaseUrl)
                .codecs(config -> config.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    public String runModel(String prompt, String modelKey) {
        String modelName = MODEL_MAP.getOrDefault(modelKey, "qwen2.5:0.5b");

        Map<String, Object> body = Map.of(
                "model",  modelName,
                "prompt", prompt,
                "stream", false
        );

        System.out.println("🤖 Calling Ollama at: " + ollamaBaseUrl + " with model: " + modelName);

        try {
            String response = getWebClient()
                    .post()
                    .uri("/api/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    // Retry up to 5 times with 15s delay between attempts
                    // This covers the model loading time (~23s on your machine)
                    .retryWhen(
                        Retry.fixedDelay(5, Duration.ofSeconds(15))
                             .doBeforeRetry(signal ->
                                 System.out.println("⏳ Ollama not ready, retrying... attempt "
                                     + (signal.totalRetries() + 1) + "/5")
                             )
                    )
                    .timeout(Duration.ofMinutes(15))
                    .map(res -> {
                        Object r = res.get("response");
                        if (r == null) {
                            throw new RuntimeException("Ollama returned null response field");
                        }
                        return r.toString();
                    })
                    .block(Duration.ofMinutes(15));

            System.out.println("✅ Ollama responded successfully");
            return response;

        } catch (WebClientResponseException e) {
            System.err.println("❌ Ollama HTTP error: " + e.getStatusCode() + " — " + e.getResponseBodyAsString());
            throw new RuntimeException("Failed to get response from model: " + modelName + " — HTTP " + e.getStatusCode(), e);
        } catch (Exception e) {
            System.err.println("❌ Ollama error: " + e.getMessage());
            throw new RuntimeException("Failed to get response from model: " + modelName + " — " + e.getMessage(), e);
        }
    }

    /**
     * Called on startup to pre-warm the model so the first real request is fast.
     * Runs in background — does not block application startup.
     */
    @jakarta.annotation.PostConstruct
    public void warmUp() {
        new Thread(() -> {
            try {
                System.out.println("🔥 Pre-warming model");
                Thread.sleep(15_000);
                runModel("Say OK", "qwen2.5:0.5b");
                System.out.println("✅ Ollama warm-up complete");
            } catch (Exception e) {
                System.out.println("⚠️ Warm-up failed (non-fatal): " + e.getMessage());
            }
        }).start();
    }

    public String runPhi3(String prompt) {
        return runModel(prompt, "phi3:mini");
    }

    public boolean isModelAvailable(String modelKey) {
        return MODEL_MAP.containsKey(modelKey);
    }

    public String[] getAvailableModels() {
        return MODEL_MAP.keySet().toArray(new String[0]);
    }

    public String getModelName(String modelKey) {
        return MODEL_MAP.getOrDefault(modelKey, "phi3:mini");
    }
}