import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "@/components/ui/button"

// Trivial smoke test — proves the Vitest + jsdom + Testing Library + `@/` alias
// pipeline works end to end against a real component. Real coverage comes later.
describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Launch</Button>)
    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument()
  })
})
