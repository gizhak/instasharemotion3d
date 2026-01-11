export function Modal({ isOpen, onClose, children, variant = 'menu' }) {
	if (!isOpen) return null;

	return (
		<>
			<div className="backdrop" onClick={onClose} />
			<div className={`modal modal-${variant}`}>{children}</div>
		</>
	);
}
