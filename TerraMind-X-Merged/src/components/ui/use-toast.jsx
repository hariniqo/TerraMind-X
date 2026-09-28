// Inspired by react-hot-toast library

import { useEffect, useState } from "react";

let nextId = 0;
let state = { toasts: [] };
const listeners = new Set();

function updateState(toasts) {
	state = { toasts };
	listeners.forEach((listener) => listener(state));
}

function dismiss(id) {
	updateState(state.toasts.filter((item) => item.id !== id));
}

export function toast({ title, description, ...options }) {
	const id = String(++nextId);
	const item = { id, title, description, ...options, open: true };
	updateState([...state.toasts, item]);
	return { id, dismiss: () => dismiss(id) };
}

export function useToast() {
	const [snapshot, setSnapshot] = useState(state);

	useEffect(() => {
		listeners.add(setSnapshot);
		return () => listeners.delete(setSnapshot);
	}, []);

	return { ...snapshot, toast, dismiss };
}