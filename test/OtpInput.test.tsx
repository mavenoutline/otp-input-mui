import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpInput, type OtpInputRef, type ResendRenderState } from "../src";

afterEach(cleanup);

const cells = () => screen.getAllByRole("textbox") as HTMLInputElement[];
const values = () => cells().map((c) => c.value).join("");

describe("OtpInput", () => {
  it("types and auto-advances, firing onComplete exactly once", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput length={4} onComplete={onComplete} />);
    await user.click(cells()[0]);
    await user.keyboard("1234");
    expect(values()).toBe("1234");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("1234");
  });

  it("does not re-fire onComplete on re-render in controlled mode", () => {
    const onComplete = vi.fn();
    const { rerender } = render(<OtpInput length={4} value="1234" onComplete={() => onComplete()} />);
    rerender(<OtpInput length={4} value="1234" onComplete={() => onComplete()} />);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("rejects characters outside the allowed set", async () => {
    const user = userEvent.setup();
    const onInvalidChar = vi.fn();
    render(<OtpInput length={4} onInvalidChar={onInvalidChar} />);
    await user.click(cells()[0]);
    await user.keyboard("a");
    expect(values()).toBe("");
    expect(onInvalidChar).toHaveBeenCalledWith("a");
  });

  it("distributes a pasted code and ignores separators", () => {
    const onChange = vi.fn();
    render(<OtpInput length={6} onChange={onChange} />);
    fireEvent.paste(cells()[0], { clipboardData: { getData: () => "123-456" } });
    expect(onChange).toHaveBeenLastCalledWith("123456");
    expect(values()).toBe("123456");
  });

  it("handles SMS autofill that dumps the whole code into the first cell", () => {
    const onComplete = vi.fn();
    render(<OtpInput length={6} onComplete={onComplete} />);
    fireEvent.change(cells()[0], { target: { value: "654321" } });
    expect(values()).toBe("654321");
    expect(onComplete).toHaveBeenCalledWith("654321");
  });

  it("backspace on an empty cell deletes the previous char and moves back", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} defaultValue="12" />);
    await user.click(cells()[2]);
    await user.keyboard("{Backspace}");
    expect(values()).toBe("1");
    expect(document.activeElement).toBe(cells()[1]);
  });

  it("redirects focus to the first empty cell", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={6} defaultValue="1" />);
    await user.click(cells()[4]);
    expect(document.activeElement).toBe(cells()[1]);
  });

  it("supports alphanumeric codes with uppercase transform", async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} type="alphanumeric" transform="uppercase" />);
    await user.click(cells()[0]);
    await user.keyboard("ab1c");
    expect(values()).toBe("AB1C");
  });

  it("masks characters with a custom mask", () => {
    render(<OtpInput length={3} defaultValue="123" mask="*" />);
    expect(values()).toBe("***");
  });

  it("submits the full value through a hidden input when `name` is set", () => {
    const { container } = render(<OtpInput length={4} defaultValue="9876" name="code" />);
    const hidden = container.querySelector('input[type="hidden"][name="code"]') as HTMLInputElement;
    expect(hidden.value).toBe("9876");
    expect(cells().every((c) => !c.name)).toBe(true);
  });

  it("is labelled as a group and links helper text", () => {
    render(<OtpInput length={4} label="Verification code" helperText="Sent by SMS" />);
    const group = screen.getByRole("group", { name: "Verification code" });
    expect(group.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByLabelText("Digit 1 of 4")).toBeTruthy();
  });

  it("only the first cell requests one-time-code autofill", () => {
    render(<OtpInput length={3} />);
    expect(cells().map((c) => c.getAttribute("autocomplete"))).toEqual(["one-time-code", "off", "off"]);
  });

  it("exposes an imperative API", () => {
    const ref = React.createRef<OtpInputRef>();
    render(<OtpInput ref={ref} length={4} />);
    act(() => ref.current!.setValue("12x34"));
    expect(ref.current!.getValue()).toBe("1234");
    act(() => ref.current!.clear());
    expect(values()).toBe("");
  });
});

describe("resend", () => {
  it("counts down, then resends and restarts", async () => {
    vi.useFakeTimers();
    try {
      const onResend = vi.fn().mockResolvedValue(undefined);
      render(<OtpInput length={4} resend={{ seconds: 3, onResend }} />);
      const button = screen.getByRole("button", { name: "Resend code" }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(screen.getByRole("timer").textContent).toBe("0:03");

      await act(async () => {
        vi.advanceTimersByTime(3100);
      });
      expect(button.disabled).toBe(false);

      await act(async () => {
        fireEvent.click(button);
      });
      expect(onResend).toHaveBeenCalledTimes(1);
      expect(button.disabled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not count a failed resend", async () => {
    const onResend = vi.fn().mockRejectedValue(new Error("network"));
    const renderResend = vi.fn((_state: ResendRenderState) => null);
    render(<OtpInput length={4} resend={{ autoStart: false, onResend, render: renderResend }} />);
    const first = renderResend.mock.calls.at(-1)![0];
    await act(() => first.resend());
    const last = renderResend.mock.calls.at(-1)![0];
    expect(last.attempts).toBe(0);
    expect(last.error).toBeInstanceOf(Error);
  });

  it("shows exhausted text after maxAttempts", async () => {
    const onResend = vi.fn().mockResolvedValue(undefined);
    render(<OtpInput length={4} resend={{ autoStart: false, seconds: 0, maxAttempts: 1, onResend }} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    });
    expect(screen.getByText("No more resends available")).toBeTruthy();
  });
});
