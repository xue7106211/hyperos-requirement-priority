import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";

describe("App", () => {
  it("默认显示单条打分，可切到批量清单", async () => {
    const user = userEvent.setup();
    render(<App />);
    await act(async () => {
      await user.click(screen.getByRole("tab", { name: /批量清单/ }));
    });
    expect(screen.getByText(/导出/)).toBeInTheDocument();
  });
});
