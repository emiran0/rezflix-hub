import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FadeIn } from "@/components/motion/fade-in";
import { PageTransition } from "@/components/motion/page-transition";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

// Control the reduced-motion signal directly so we test OUR branching logic, not
// Motion's matchMedia plumbing (which doesn't react to a late jsdom swap).
const { reducedMotionMock } = vi.hoisted(() => ({
  reducedMotionMock: vi.fn(() => false),
}));
vi.mock("motion/react", async (importActual) => {
  const actual = await importActual<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => reducedMotionMock() };
});

afterEach(() => reducedMotionMock.mockReturnValue(false));

describe("motion primitives", () => {
  it("FadeIn renders its children", () => {
    render(<FadeIn>hello</FadeIn>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("PageTransition renders its children", () => {
    render(<PageTransition>page body</PageTransition>);
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("PageTransition renders a plain div with no animation under reduced motion", () => {
    reducedMotionMock.mockReturnValue(true);
    const { container } = render(<PageTransition>reduced</PageTransition>);

    expect(screen.getByText("reduced")).toBeInTheDocument();
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe("DIV");
    // The reduced branch is a plain <div> — no Motion inline opacity/transform.
    expect(el).not.toHaveAttribute("style");
  });

  it("FadeIn skips the initial hidden state under reduced motion", () => {
    reducedMotionMock.mockReturnValue(true);
    const { container } = render(<FadeIn>now</FadeIn>);

    expect(screen.getByText("now")).toBeInTheDocument();
    // initial={false} -> no opacity:0 start; content is shown immediately.
    const style =
      (container.firstElementChild as HTMLElement).getAttribute("style") ?? "";
    expect(style).not.toContain("opacity: 0");
  });
});
