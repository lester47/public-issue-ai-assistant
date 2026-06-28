"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex?: number;
  results: ArrayLike<{
    isFinal?: boolean;
    0: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionErrorEvent = {
  error?: string;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceInputButtonProps = {
  onTranscript: (text: string) => void;
  onUseKeyboardMic?: () => void;
  disabled?: boolean;
};

export function VoiceInputButton({
  onTranscript,
  onUseKeyboardMic,
  disabled
}: VoiceInputButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const transcriptBufferRef = useRef("");
  const [isListening, setIsListening] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [message, setMessage] = useState("");
  const [guide, setGuide] = useState<string[]>([
    "電腦 Chrome/Edge：按住按鈕說話，放開才結束。",
    "iPhone：點文字框後，用鍵盤上的麥克風輸入最穩。",
    "如果是在 LINE/FB 內建瀏覽器，建議改用 Safari 開啟。"
  ]);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    const isiPhoneOrIPad = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isiPhoneOrIPad);
    setIsSupported(
      Boolean(speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition)
    );

    if (isiPhoneOrIPad) {
      setGuide([
        "請先點文字框，讓 iPhone 鍵盤跳出來。",
        "按鍵盤上的麥克風開始說話。",
        "說完按鍵盤上的完成，再按「開始分析」。"
      ]);
    }

    return () => {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.abort?.();
      recognitionRef.current?.stop();
    };
  }, []);

  async function startHolding(pointerId?: number) {
    if (disabled || isListening || isRequestingPermission) return;

    if (isIOS) {
      openKeyboardMicGuide();
      return;
    }

    buttonRef.current?.setPointerCapture?.(pointerId ?? 0);
    shouldKeepListeningRef.current = true;
    transcriptBufferRef.current = "";

    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      setIsSupported(false);
      setMessage("這個瀏覽器不支援按鈕語音辨識。請用 Chrome/Edge，或使用手機鍵盤麥克風。");
      return;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission || !shouldKeepListeningRef.current) return;

    setMessage("正在聽，請繼續說。放開按鈕才會停止。");
    startRecognition(Recognition);
  }

  function stopHolding() {
    if (isIOS) return;

    shouldKeepListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);

    if (transcriptBufferRef.current.trim()) {
      onTranscript(transcriptBufferRef.current.trim());
      setMessage("語音已填入文字框。");
    } else if (!isRequestingPermission) {
      setMessage("沒有聽到內容。請按住按鈕再說一次。");
    }
  }

  function openKeyboardMicGuide() {
    onUseKeyboardMic?.();
    setMessage("iPhone 請使用鍵盤上的麥克風。這比網頁按鈕語音更穩。");
    setGuide([
      "文字框已經幫你點開。",
      "請按 iPhone 鍵盤右下角或左下角的麥克風。",
      "說完後按完成，再按「開始分析」。"
    ]);
  }

  function startRecognition(Recognition: SpeechRecognitionConstructor) {
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "zh-TW";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      const startIndex = event.resultIndex ?? 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;

        if (result.isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += `${transcript} `;
        }
      }

      if (finalText) {
        transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalText}`.trim();
      }

      const visibleText = `${transcriptBufferRef.current} ${interimText}`.trim();
      if (visibleText) onTranscript(visibleText);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!shouldKeepListeningRef.current) return;

      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setMessage("語音辨識暫停了，請繼續按住或放開後再試一次。");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" && shouldKeepListeningRef.current) return;

      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldKeepListeningRef.current = false;
        setMessage("瀏覽器允許麥克風，但不允許網頁語音轉文字。請改用鍵盤上的麥克風。");
        setGuide([
          "點文字框，讓鍵盤跳出來。",
          "按鍵盤上的麥克風說話。",
          "這是 iPhone 上最穩定的語音輸入方式。"
        ]);
        onUseKeyboardMic?.();
        return;
      }

      setMessage("語音辨識沒有成功。請按住按鈕再說一次。");
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setMessage("語音辨識無法啟動。請重新整理頁面，或改用手機鍵盤麥克風。");
    }
  }

  async function requestMicrophonePermission() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("這個瀏覽器無法跳出麥克風權限視窗。請用 Chrome/Edge，或使用手機鍵盤麥克風。");
      return false;
    }

    setIsRequestingPermission(true);
    setMessage("請在瀏覽器跳出的視窗按「允許」麥克風權限。");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      shouldKeepListeningRef.current = false;
      setMessage("沒有取得麥克風權限。請在瀏覽器網址列旁的權限設定允許麥克風。");
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  }

  function getRecognitionConstructor() {
    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    void startHolding(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    stopHolding();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== " " && event.key !== "Enter")) return;
    event.preventDefault();
    void startHolding();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stopHolding();
  }

  return (
    <div className="voice-control">
      <button
        ref={buttonRef}
        className={isListening ? "voice-button active" : "voice-button"}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopHolding}
        onPointerLeave={stopHolding}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        disabled={disabled || isRequestingPermission}
        aria-pressed={isListening}
      >
        <span aria-hidden="true">{isListening ? "■" : "🎤"}</span>
        {isIOS
          ? "打開鍵盤麥克風"
          : isListening
            ? "放開結束"
            : isRequestingPermission
              ? "等待授權"
              : "按住說話"}
      </button>
      {message ? <p role="status">{message}</p> : null}
      {!isSupported && !isIOS ? (
        <p role="status">目前瀏覽器不支援按鈕語音輸入。</p>
      ) : null}
      <div className="voice-guide" aria-label="語音輸入引導">
        <strong>{isIOS ? "iPhone 語音輸入" : "按住說話模式"}</strong>
        <ol>
          {guide.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
