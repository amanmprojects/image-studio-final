'use client';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputHeader,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon, ImageIcon, DownloadIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';


const models = [
  { id: 'models/gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'models/gemini-3-pro-preview', name: 'Gemini 3 Pro' },
  { id: 'models/gemini-2.5-flash-image', name: 'Nano Banana 🍌' },
  { id: 'moonshotai/kimi-k2-thinking-maas', name: 'Kimik 2 Thinking MAAS' },
  { id: 'minimaxai/minimax-m2-maas', name: 'MiniMax M2 MAAS' },
];

const aspectRatios = [
  { value: '1:1', label: '1:1' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
];

// Helper function to download image from data URL
const downloadImage = (dataUrl: string, filename: string = `generated-image-${Date.now()}.png`) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to copy image to clipboard
const copyImageToClipboard = async (dataUrl: string): Promise<boolean> => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
};

// Image component with download/copy buttons
const GeneratedImage = ({ src, alt }: { src: string; alt: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyImageToClipboard(src);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group max-w-xs mt-2">
      <img
        src={src}
        alt={alt}
        className="h-auto w-full rounded-lg"
      />
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="size-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => downloadImage(src)}
        >
          <DownloadIcon size={14} />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="size-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleCopy}
        >
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
        </Button>
      </div>
    </div>
  );
};

const Page = () => {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isImageModel = model.includes('image');
  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/generate-image',
    }),
  });
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: useWebSearch,
          aspectRatio: aspectRatio,
        },
      },
    );
    setText('');
  };
  return (
    <div className="max-w-[calc(100%-50px)] mx-auto p-6 relative size-full rounded-lg border h-[95%] transition-all duration-1000">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      case 'file':
                        if (part.mediaType?.startsWith('image/')) {
                          return (
                            <GeneratedImage
                              key={`${message.id}-${i}`}
                              src={part.url}
                              alt="Generated image"
                            />
                          );
                        }
                        return null;
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>



        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>

            <PromptInputTextarea
              onChange={(e) => setText(e.target.value)}
              ref={textareaRef}
              value={text}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputSpeechButton
                onTranscriptionChange={setText}
                textareaRef={textareaRef}
              />
              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant={useWebSearch ? 'default' : 'ghost'}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
              {isImageModel && (
                <Select
                  onValueChange={setAspectRatio}
                  value={aspectRatio}
                >
                  <SelectTrigger className="w-auto gap-2">
                    <ImageIcon size={16} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default Page;