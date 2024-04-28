import { Button, Input, Switch, Textarea } from "@mui/joy";
import { useState } from "react";
import { workspaceSettingServiceClient } from "@/grpcweb";
import { WorkspaceSettingPrefix, useWorkspaceSettingStore } from "@/store/v1";
import { WorkspaceLLMSetting, WorkspaceSettingKey } from "@/types/proto/store/workspace_setting";

const LLMSection = () => {
  const workspaceSettingStore = useWorkspaceSettingStore();
  const [workspaceLLMSetting, setWorkspaceLLMSetting] = useState<WorkspaceLLMSetting>(
    WorkspaceLLMSetting.fromPartial(
      workspaceSettingStore.getWorkspaceSettingByKey(WorkspaceSettingKey.WORKSPACE_SETTING_LLM)?.llmSetting || {},
    ),
  );

  const saveLLMSetting = async (setting: WorkspaceLLMSetting) => {
    await workspaceSettingServiceClient.setWorkspaceSetting({
      setting: {
        name: `${WorkspaceSettingPrefix}${WorkspaceSettingKey.WORKSPACE_SETTING_LLM}`,
        llmSetting: setting,
      },
    });
    setWorkspaceLLMSetting(setting);
  };

  const handleEnableOrDisable = async () => {
    const setting: WorkspaceLLMSetting = {
      ...workspaceLLMSetting,
      enabled: workspaceLLMSetting.enabled === true ? false : true,
    };
    await saveLLMSetting(setting);
  };

  const handleEndpointChange = (value: string) => {
    setWorkspaceLLMSetting({ ...workspaceLLMSetting, endpoint: value });
  };

  const handleModelChange = (value: string) => {
    setWorkspaceLLMSetting({ ...workspaceLLMSetting, model: value });
  };

  const handlePromptChange = (value: string) => {
    setWorkspaceLLMSetting({ ...workspaceLLMSetting, prompt: value });
  };

  const handleSave = async () => {
    await saveLLMSetting(workspaceLLMSetting);
  };

  return (
    <>
      <p className="font-medium text-gray-700 dark:text-gray-500">LLM related settings</p>

      <div className="w-full flex flex-row justify-between items-center">
        <span>Enable LLM Features</span>
        <Switch checked={workspaceLLMSetting.enabled} onChange={handleEnableOrDisable} />
      </div>
      {workspaceLLMSetting.enabled === true && (
        <>
          <div className="space-y-2 border rounded-md py-2 px-3 dark:border-zinc-700">
            <div className="w-full flex flex-row justify-between items-center">
              <div className="flex flex-row items-center">
                <div className="w-auto flex items-center">
                  <span className="mr-1">LLM Endpoint URL</span>
                </div>
              </div>
              <Button variant="outlined" color="neutral" onClick={handleSave}>
                Save
              </Button>
            </div>
            <Input
              className="w-full"
              sx={{
                fontFamily: "monospace",
                fontSize: "14px",
              }}
              placeholder={"Should be started with http:// or https://"}
              value={workspaceLLMSetting.endpoint}
              onChange={(event) => handleEndpointChange(event.target.value)}
            />

            <div className="w-full flex flex-row justify-between items-center">
              <div className="flex flex-row items-center">
                <div className="w-auto flex items-center">
                  <span className="mr-1">Model</span>
                </div>
              </div>
              <Button variant="outlined" color="neutral" onClick={handleSave}>
                Save
              </Button>
            </div>

            <Input
              className="w-full"
              sx={{
                fontFamily: "monospace",
                fontSize: "14px",
              }}
              placeholder={"LLM models like 'llama3'"}
              value={workspaceLLMSetting.model}
              onChange={(event) => handleModelChange(event.target.value)}
            />

            <div className="w-full flex flex-row justify-between items-center">
              <div className="flex flex-row items-center">
                <div className="w-auto flex items-center">
                  <span className="mr-1">Prompt</span>
                </div>
              </div>
              <Button variant="outlined" color="neutral" onClick={handleSave}>
                Save
              </Button>
            </div>

            <Textarea
              className="w-full"
              sx={{
                fontFamily: "monospace",
                fontSize: "14px",
              }}
              minRows={2}
              maxRows={4}
              placeholder={"Summarize the content below:\n------\n${CONTENT}"}
              value={workspaceLLMSetting.prompt}
              onChange={(event) => handlePromptChange(event.target.value)}
            />
          </div>
        </>
      )}
    </>
  );
};

export default LLMSection;
