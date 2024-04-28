import { Button, Divider, Skeleton } from "@mui/joy";
import { memo, useState } from "react";
import { useMemoStore } from "@/store/v1";
import { Memo } from "@/types/proto/api/v2/memo_service";
import MemoContent from "./MemoContent";

interface Props {
  memo: Memo;
}

const MemoSummaryView: React.FC<Props> = (props: Props) => {
  const summary = props.memo.summary;
  const [generating, setGenerating] = useState(false);
  const memoStore = useMemoStore();

  const generateSummary = () => {
    setGenerating(true);
    memoStore.createSummary(props.memo.name).finally(() => {
      setGenerating(false);
    });
  };

  return (
    <>
      {summary !== "" && (
        <>
          <p>
            <b>Summary:</b>
          </p>
          {generating ? (
            <>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </>
          ) : (
            <MemoContent content={summary} readonly={true} />
          )}
          <Button variant="plain" loading={generating} disabled={generating} onClick={generateSummary}>
            Regenerate
          </Button>
        </>
      )}
      {summary === "" && (
        <>
          {generating && (
            <>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </>
          )}
          <Button variant="plain" loading={generating} disabled={generating} onClick={generateSummary}>
            Generate Now
          </Button>
        </>
      )}
      <Divider />
    </>
  );
};

export default memo(MemoSummaryView);
