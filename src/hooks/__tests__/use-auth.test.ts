import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../use-auth";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock all the dependencies with vi.fn() directly in the mock
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Import the modules to get the mocked functions
import * as actions from "@/actions";
import * as getProjectsModule from "@/actions/get-projects";
import * as createProjectModule from "@/actions/create-project";
import * as anonTracker from "@/lib/anon-work-tracker";

describe("useAuth", () => {
  // Get the mocked functions
  const mockSignInAction = vi.mocked(actions.signIn);
  const mockSignUpAction = vi.mocked(actions.signUp);
  const mockGetProjects = vi.mocked(getProjectsModule.getProjects);
  const mockCreateProject = vi.mocked(createProjectModule.createProject);
  const mockGetAnonWorkData = vi.mocked(anonTracker.getAnonWorkData);
  const mockClearAnonWork = vi.mocked(anonTracker.clearAnonWork);

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  test("should return initial state with correct properties", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toEqual({
      signIn: expect.any(Function),
      signUp: expect.any(Function),
      isLoading: false,
    });
  });

  describe("signIn", () => {
    test("should successfully sign in and navigate to existing project", async () => {
      // Setup mocks for successful sign in with existing project
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([
        { id: "project-1", name: "Existing Project" },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "password123");
        expect(response).toEqual({ success: true });
      });

      expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    test("should handle sign in failure", async () => {
      const failureResult = { success: false, error: "Invalid credentials" };
      mockSignInAction.mockResolvedValue(failureResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signIn("test@example.com", "wrongpassword");
        expect(response).toEqual(failureResult);
      });

      expect(mockSignInAction).toHaveBeenCalledWith("test@example.com", "wrongpassword");
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("should handle anonymous work by creating project", async () => {
      const anonWork = {
        messages: [{ id: "1", content: "test message" }],
        fileSystemData: { "file1.tsx": "content" },
      };
      
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "anon-project-1" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockGetAnonWorkData).toHaveBeenCalled();
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from \d+:\d+:\d+ (AM|PM)$/),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-project-1");
    });

    test("should create new project when no projects exist", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-project-1" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-project-1");
    });
  });

  describe("signUp", () => {
    test("should successfully sign up and create new project", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "new-user-project" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp("newuser@example.com", "password123");
        expect(response).toEqual({ success: true });
      });

      expect(mockSignUpAction).toHaveBeenCalledWith("newuser@example.com", "password123");
      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/new-user-project");
    });

    test("should handle sign up failure", async () => {
      const failureResult = { success: false, error: "Email already exists" };
      mockSignUpAction.mockResolvedValue(failureResult);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const response = await result.current.signUp("test@example.com", "password123");
        expect(response).toEqual(failureResult);
      });

      expect(mockSignUpAction).toHaveBeenCalledWith("test@example.com", "password123");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    test("should set loading to false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("should clear loading state after error", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});