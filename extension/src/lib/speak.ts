// Đọc text tiếng Đức qua Web Speech API (de-DE). Guard — không hỗ trợ/ lỗi → im lặng.
export function speakDe(text: string): void {
  if (!text) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "de-DE";
    synth.cancel();
    synth.speak(u);
  } catch {
    // trình duyệt không hỗ trợ → bỏ qua
  }
}
