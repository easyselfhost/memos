package llmsummarizer

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/usememos/memos/internal/llm"
	storepb "github.com/usememos/memos/proto/gen/store"
	"github.com/usememos/memos/store"
)

const defaultPromptTemplate = `Summarize the content below:
{CONTENT}`

type LLMSummarizer struct {
	Store     *store.Store
	LLMClient *llm.LLMClient
	PromptTpl string
}

func getLLMSetting(ctx context.Context, s *store.Store) (*storepb.WorkspaceLLMSetting, error) {
	setting, err := s.GetWorkspaceSetting(ctx, &store.FindWorkspaceSetting{
		Name: storepb.WorkspaceSettingKey_WORKSPACE_SETTING_LLM.String(),
	})
	if err != nil {
		return nil, err
	}
	if setting == nil {
		return nil, nil
	}

	llmSetting := setting.GetLlmSetting()
	if llmSetting == nil || !llmSetting.Enabled {
		return nil, nil
	}
	if llmSetting.Endpoint == "" || llmSetting.Model == "" {
		return nil, fmt.Errorf("LLM endpoint or model not set")
	}
	return llmSetting, nil
}

func IsLLMEnabled(ctx context.Context, s *store.Store) (bool, error) {
	setting, err := getLLMSetting(ctx, s)
	if err != nil {
		return false, err
	}
	return setting != nil, nil
}

func NewLLMSummarizer(s *store.Store) (*LLMSummarizer, error) {
	ctx := context.Background()

	llmSetting, err := getLLMSetting(ctx, s)
	if err != nil {
		return nil, err
	}
	if llmSetting == nil {
		return nil, fmt.Errorf("LLM not enabled")
	}

	llmClient := llm.NewLLMClient(llmSetting.Endpoint, llmSetting.Model, nil)

	promptTpl := llmSetting.Prompt
	if strings.TrimSpace(promptTpl) == "" {
		promptTpl = defaultPromptTemplate
	}

	return &LLMSummarizer{
		Store:     s,
		LLMClient: llmClient,
		PromptTpl: promptTpl,
	}, nil
}

func (l *LLMSummarizer) CreateSummary(ctx context.Context, memo *store.Memo) (string, error) {
	prompt := strings.Replace(l.PromptTpl, "{CONTENT}", memo.Content, 1)

	summary, err := l.LLMClient.Generate(ctx, prompt)
	if err != nil {
		return "", err
	}

	return summary, nil
}

func CreateSummaryForAll(ctx context.Context, l *LLMSummarizer) {
	slog.Info("Starting to generate summary for memos...")

	memos, err := l.Store.ListMemos(ctx, &store.FindMemo{})
	if err != nil {
		slog.Error("Failed to generate summary", err)
		return
	}

	for _, memo := range memos {
		select {
		case <-ctx.Done():
			return
		default:
		}

		if memo.Summary != "" {
			continue
		}

		summary, err := l.CreateSummary(ctx, memo)
		if err != nil {
			slog.Error("Failed to create summary", err)
			return
		}

		err = l.Store.UpdateMemo(ctx, &store.UpdateMemo{
			ID:      memo.ID,
			Summary: &summary,
		})
		if err != nil {
			slog.Error("Failed to update memo", err)
			return
		}
		slog.Info("Summary generated for memo", "id", memo.ID, "summary", summary)
	}

}

func StartSummaryService(ctx context.Context, s *store.Store) {
	l, err := NewLLMSummarizer(s)
	if err != nil {
		slog.Warn("Summary service not started", err)
	} else {
		CreateSummaryForAll(ctx, l)
	}

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		l, _ = NewLLMSummarizer(s)
		if l != nil {
			CreateSummaryForAll(ctx, l)
		}
	}
}
