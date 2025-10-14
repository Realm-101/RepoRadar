import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TagsTab } from "../tags-tab";
import * as queryClient from "@/lib/queryClient";

// Mock the API request function
vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockTags = [
  {
    id: 1,
    userId: "user-1",
    name: "Frontend",
    color: "#3b82f6",
    createdAt: "2024-01-15T10:00:00Z",
    repositoryCount: 5,
  },
  {
    id: 2,
    userId: "user-1",
    name: "Backend",
    color: "#22c55e",
    createdAt: "2024-01-16T10:00:00Z",
    repositoryCount: 3,
  },
  {
    id: 3,
    userId: "user-1",
    name: "DevOps",
    color: "#f59e0b",
    createdAt: "2024-01-17T10:00:00Z",
    repositoryCount: 0,
  },
];

describe("TagsTab", () => {
  let testQueryClient: QueryClient;

  beforeEach(() => {
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={testQueryClient}>
        <TagsTab />
      </QueryClientProvider>
    );
  };

  const mockApiResponse = (data: any) => {
    return Promise.resolve({
      ok: true,
      json: async () => data,
    } as Response);
  };

  describe("Loading State", () => {
    it("should display loading skeletons while fetching tags", async () => {
      // Mock fetch to never resolve
      global.fetch = vi.fn(() => new Promise(() => {}));

      renderComponent();

      // Should show skeleton elements
      await waitFor(() => {
        const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error State", () => {
    it("should display error message when tags fail to load", async () => {
      const errorMessage = "Failed to fetch tags";
      global.fetch = vi.fn(() => 
        Promise.reject(new Error(errorMessage))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Failed to load tags")).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it("should allow retry after error", async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => mockTags,
        } as Response);
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Failed to load tags")).toBeInTheDocument();
      });

      const retryButton = screen.getByRole("button", { name: /try again/i });
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no tags exist", async () => {
      global.fetch = vi.fn(() => mockApiResponse([]));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("No tags yet")).toBeInTheDocument();
        expect(
          screen.getByText(/Create custom tags to organize your repositories/i)
        ).toBeInTheDocument();
      });
    });

    it("should show create button in empty state", async () => {
      global.fetch = vi.fn(() => mockApiResponse([]));

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /create your first tag/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Tags Display", () => {
    it("should display all tags with correct information", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
        expect(screen.getByText("Backend")).toBeInTheDocument();
        expect(screen.getByText("DevOps")).toBeInTheDocument();
      });

      expect(screen.getByText("5 repositories")).toBeInTheDocument();
      expect(screen.getByText("3 repositories")).toBeInTheDocument();
      expect(screen.getByText("0 repositories")).toBeInTheDocument();
    });

    it("should display correct tag count in header", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("3 Tags")).toBeInTheDocument();
      });
    });

    it("should display singular 'Tag' for single tag", async () => {
      global.fetch = vi.fn(() => mockApiResponse([mockTags[0]]));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("1 Tag")).toBeInTheDocument();
      });
    });

    it("should display tags in responsive grid", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        const grid = screen.getByText("Frontend").closest(".grid");
        expect(grid).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-3");
      });
    });
  });

  describe("Create Tag Form", () => {
    it("should show create form when create button is clicked", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      expect(screen.getByLabelText(/tag name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });

    it("should hide create form when cancel is clicked", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      // Open form
      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      expect(screen.getByLabelText(/tag name/i)).toBeInTheDocument();

      // Close form
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/tag name/i)).not.toBeInTheDocument();
      });
    });

    it("should validate empty tag name", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      const submitButton = screen.getByRole("button", { name: /^create tag$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Tag name is required")).toBeInTheDocument();
      });
    });

    it("should validate tag name length", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/tag name/i);
      await userEvent.type(nameInput, "a".repeat(51));

      const submitButton = screen.getByRole("button", { name: /^create tag$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Tag name must be 50 characters or less")
        ).toBeInTheDocument();
      });
    });

    it("should validate duplicate tag names", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/tag name/i);
      await userEvent.type(nameInput, "Frontend");

      const submitButton = screen.getByRole("button", { name: /^create tag$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("A tag with this name already exists")
        ).toBeInTheDocument();
      });
    });

    it("should create tag with valid data", async () => {
      const newTag = {
        id: 4,
        userId: "user-1",
        name: "Testing",
        color: "#ef4444",
        createdAt: new Date().toISOString(),
        repositoryCount: 0,
      };

      let callCount = 0;
      global.fetch = vi.fn((url) => {
        callCount++;
        if (callCount === 1) {
          return mockApiResponse(mockTags);
        } else if (url.includes("/api/tags") && callCount === 2) {
          return mockApiResponse(newTag);
        } else {
          return mockApiResponse([...mockTags, newTag]);
        }
      });

      vi.mocked(queryClient.apiRequest).mockResolvedValue(mockApiResponse(newTag));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/tag name/i);
      await userEvent.type(nameInput, "Testing");

      const submitButton = screen.getByRole("button", { name: /^create tag$/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(queryClient.apiRequest).toHaveBeenCalledWith("POST", "/api/tags", {
          name: "Testing",
          color: expect.any(String),
        });
      });
    });

    it("should allow color selection", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      // Color buttons should be present
      const colorButtons = screen.getAllByRole("button", {
        name: /select color/i,
      });
      expect(colorButtons.length).toBeGreaterThan(0);

      // Click a color
      await userEvent.click(colorButtons[5]);

      // The color should be selected (visual feedback)
      expect(colorButtons[5]).toHaveClass("scale-110");
    });
  });

  describe("Delete Tag", () => {
    it("should show delete button on hover", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      expect(deleteButtons.length).toBe(mockTags.length);
    });

    it("should show confirmation dialog when delete is clicked", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Tag")).toBeInTheDocument();
        expect(
          screen.getByText(/are you sure you want to delete the tag "frontend"/i)
        ).toBeInTheDocument();
      });
    });

    it("should cancel delete when cancel is clicked", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Tag")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Delete Tag")).not.toBeInTheDocument();
      });
    });

    it("should delete tag when confirmed", async () => {
      let callCount = 0;
      global.fetch = vi.fn((url) => {
        callCount++;
        if (callCount === 1) {
          return mockApiResponse(mockTags);
        } else {
          return mockApiResponse(mockTags.slice(1));
        }
      });

      vi.mocked(queryClient.apiRequest).mockResolvedValue(mockApiResponse(undefined));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Tag")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(queryClient.apiRequest).toHaveBeenCalledWith(
          "DELETE",
          "/api/tags/1"
        );
      });
    });

    it("should show repository count in delete confirmation", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/this will remove the tag from all 5 associated repositories/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Optimistic Updates", () => {
    it("should optimistically remove tag from UI", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));
      vi.mocked(queryClient.apiRequest).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Delete Tag")).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$/i });
      await userEvent.click(confirmButton);

      // Tag should be removed optimistically
      await waitFor(() => {
        expect(screen.queryByText("Frontend")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", async () => {
      global.fetch = vi.fn(() => mockApiResponse(mockTags));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText(/delete tag/i);
      expect(deleteButtons.length).toBe(mockTags.length);
    });

    it("should support keyboard navigation in create form", async () => {
      const newTag = {
        id: 4,
        userId: "user-1",
        name: "Testing",
        color: "#ef4444",
        createdAt: new Date().toISOString(),
        repositoryCount: 0,
      };

      global.fetch = vi.fn(() => mockApiResponse(mockTags));
      vi.mocked(queryClient.apiRequest).mockResolvedValue(mockApiResponse(newTag));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Frontend")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create tag/i });
      await userEvent.click(createButton);

      const nameInput = screen.getByLabelText(/tag name/i);
      await userEvent.type(nameInput, "Testing{Enter}");

      await waitFor(() => {
        expect(queryClient.apiRequest).toHaveBeenCalledWith("POST", "/api/tags", {
          name: "Testing",
          color: expect.any(String),
        });
      });
    });
  });
});
