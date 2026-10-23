import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { App } from "@/App";

// Match routes the way the app does: render the real route table and assert a
// page-specific heading appears instead of the not-found screen.
describe("App routing", () => {
  it("renders the home page for / instead of falling back to not found", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: /red highway/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /award winners/i })).toBeInTheDocument();
    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument();
  });

  it("renders the films catalog for /films", () => {
    render(
      <MemoryRouter initialEntries={["/films"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  it("renders the 404 page for an unknown route", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /lost frame/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the studio/i })).toBeInTheDocument();
  });

  it("renders the gallery page for /gallery", () => {
    render(
      <MemoryRouter initialEntries={["/gallery"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /gallery/i })).toBeInTheDocument();
    // Each film gets its own heading plus an 8-photo set (two rows of four).
    expect(screen.getByRole("heading", { name: /^red highway$/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /open red highway/i })).toHaveLength(8);
  });

  it("renders the awards page for /awards", () => {
    render(
      <MemoryRouter initialEntries={["/awards"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /awards/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all honors/i })).toBeInTheDocument();
  });

  it("renders the login page with only email and password fields", () => {
    window.localStorage.removeItem("lumen-session");
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: /sign in/i });
    const form = submit.closest("form");
    expect(form).not.toBeNull();

    const inputs = within(form as HTMLElement).getAllByRole("textbox");
    const email = within(form as HTMLElement).getByLabelText(/email/i);
    const password = within(form as HTMLElement).getByLabelText(/password/i);
    expect(email).toHaveAttribute("type", "email");
    expect(password).toHaveAttribute("type", "password");
    // Only two inputs live inside the form: email + password (password is a
    // hidden-typed input, so it isn't reported as a textbox).
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toBe(email);
  });
});
