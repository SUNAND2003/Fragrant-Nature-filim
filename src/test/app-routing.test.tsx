import { render, screen, within, fireEvent } from "@testing-library/react";
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

  it("renders the categories page for /categories", async () => {
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <App />
      </MemoryRouter>,
    );

    // PageTitle renders "The" as the h1 and the outlined word as the h2.
    expect(screen.getByRole("heading", { level: 2, name: /categories/i })).toBeInTheDocument();
    // The page owns its data load now: it starts in the loading state and, with
    // no API in this test, settles on its error panel rather than an empty list.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /all awards/i })).toBeInTheDocument();
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

  it("renders the news page and navigates to a news article", () => {
    render(
      <MemoryRouter initialEntries={["/news"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /^news$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /drown takes the grand jury prize/i }),
    ).toBeInTheDocument();
  });

  it("renders the dedicated news article page for /news/:id", () => {
    render(
      <MemoryRouter initialEntries={["/news/1"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /drown takes the grand jury prize/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/back to all dispatches/i)).toBeInTheDocument();
  });

  it("renders the contact page for /contact with inquiry categories and form", () => {
    render(
      <MemoryRouter initialEntries={["/contact"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /^get in/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^send a message/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /general inquiries/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /theatrical & distribution/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /press & festivals/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send dispatch/i })).toBeInTheDocument();
  });

  it("renders the about page with the news & dispatches subcategory section", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /^made for/i })).toBeInTheDocument();
    expect(screen.getByText(/about subcategory/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /news & dispatches/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /all news dispatches/i })).toBeInTheDocument();
  });

  it("toggles the about dropdown in the menu to reveal the news subcategory and navigate to news", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Open main menu
    const menuBtn = screen.getByRole("button", { name: /menu/i });
    fireEvent.click(menuBtn);

    // Click About dropdown toggle button
    const aboutToggle = screen.getByRole("button", { name: /toggle news subcategory dropdown/i });
    expect(aboutToggle).toBeInTheDocument();
    fireEvent.click(aboutToggle);

    // Check that ONLY the News subcategory link is rendered in the dropdown
    const newsSubLink = screen.getByRole("link", { name: /^news/i });
    expect(newsSubLink).toBeInTheDocument();
    expect(newsSubLink).toHaveAttribute("href", "/news");

    // Click on the News subcategory link
    fireEvent.click(newsSubLink);

    // Navigates normally to the news page
    expect(
      await screen.findByRole("heading", { name: /^news$/i }, { timeout: 8000 }),
    ).toBeInTheDocument();
  }, 15000);

  it("toggles the footer about dropdown to reveal the news subcategory and navigate to news", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    // Click footer About dropdown toggle button
    const footerAboutToggle = screen.getByRole("button", { name: /toggle footer news dropdown/i });
    expect(footerAboutToggle).toBeInTheDocument();
    fireEvent.click(footerAboutToggle);

    // Check that ONLY the News subcategory link is rendered in the dropdown
    const newsSubLink = screen.getByRole("link", { name: /^news/i });
    expect(newsSubLink).toBeInTheDocument();
    expect(newsSubLink).toHaveAttribute("href", "/news");

    // Click on the News subcategory link
    fireEvent.click(newsSubLink);

    // Navigates normally to the news page
    expect(
      await screen.findByRole("heading", { name: /^news$/i }, { timeout: 8000 }),
    ).toBeInTheDocument();
  }, 15000);
});
