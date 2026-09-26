"use client";

import { useParams } from "next/navigation";
import { ProductForm } from "../ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductForm key={id} id={id} />;
}
