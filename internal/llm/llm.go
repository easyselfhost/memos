package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
)

type LLMClient struct {
	endpoint string
	model    string
	client   *http.Client
}

func NewLLMClient(endpoint string, model string, client *http.Client) *LLMClient {
	if client == nil {
		client = &http.Client{}
	}

	return &LLMClient{
		endpoint: endpoint,
		model:    model,
		client:   client,
	}
}

func (l *LLMClient) Generate(ctx context.Context, prompt string) (string, error) {
	genReq := struct {
		Model  string `json:"model"`
		Prompt string `json:"prompt"`
		Stream bool   `json:"stream"`
	}{
		Model:  l.model,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(genReq)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", l.endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req = req.WithContext(ctx)

	resp, err := l.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var respData struct {
		Response string `json:"response"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if err = json.Unmarshal(body, &respData); err != nil {
		return "", err
	}

	return respData.Response, nil
}
