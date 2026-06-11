import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CardGrid } from "@/components/card-grid"
import { PageContainer } from "@/components/page-container"
import { Section } from "@/components/section"

// Proves the shared layout primitives render children and merge an override class
// onto their base utilities (the cn() wiring), without re-testing Tailwind itself.
describe("layout primitives", () => {
  it("PageContainer renders children and keeps its base + override classes", () => {
    render(<PageContainer className="extra">inside</PageContainer>)
    const el = screen.getByText("inside")
    expect(el).toHaveClass("max-w-6xl")
    expect(el).toHaveClass("extra")
  })

  it("Section renders as a <section> and merges an override class", () => {
    render(
      <Section data-testid="s" className="extra">
        body
      </Section>,
    )
    const el = screen.getByTestId("s")
    expect(el.tagName).toBe("SECTION")
    expect(el).toHaveClass("py-8")
    expect(el).toHaveClass("extra")
  })

  it("CardGrid is a grid and merges an override class", () => {
    render(
      <CardGrid data-testid="g" className="extra">
        cards
      </CardGrid>,
    )
    const el = screen.getByTestId("g")
    expect(el).toHaveClass("grid")
    expect(el).toHaveClass("extra")
  })
})
