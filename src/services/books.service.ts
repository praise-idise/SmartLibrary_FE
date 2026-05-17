import { apiClient } from "@/api/client";
import type { Book } from "@/api/types";

export interface BookSearchParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  author?: string;
  category?: string;
  year?: number;
  availability?: "AVAILABLE" | "BORROWED" | "RESERVED";
}

export interface UpsertBookInput {
  title: string;
  author: string;
  category: string;
  isbn: string;
  publicationYear: number;
  description: string;
  totalCopies: number;
  coverImage?: File | null;
}

export async function fetchBooks(params: BookSearchParams = {}) {
  return apiClient.getPaginated<Book>("/books", params as Record<string, string | number>);
}

export async function fetchBookById(bookId: string) {
  return apiClient.get<Book>(`/books/${bookId}`);
}

export async function createBook(input: UpsertBookInput) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("author", input.author);
  formData.append("category", input.category);
  formData.append("isbn", input.isbn);
  formData.append("publicationYear", String(input.publicationYear));
  formData.append("description", input.description);
  formData.append("totalCopies", String(input.totalCopies));

  if (input.coverImage) {
    formData.append("coverImage", input.coverImage);
  }

  return apiClient.postForm<Book>("/books", formData);
}

export async function updateBook(bookId: string, input: UpsertBookInput) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("author", input.author);
  formData.append("category", input.category);
  formData.append("isbn", input.isbn);
  formData.append("publicationYear", String(input.publicationYear));
  formData.append("description", input.description);
  formData.append("totalCopies", String(input.totalCopies));

  if (input.coverImage) {
    formData.append("coverImage", input.coverImage);
  }

  return apiClient.putForm<Book>(`/books/${bookId}`, formData);
}

export async function deleteBook(bookId: string) {
  return apiClient.delete<null>(`/books/${bookId}`);
}
