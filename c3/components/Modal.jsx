'use client';
import { useEffect, useState } from 'react';

export default function Modal({ isOpen, title, onClose, onSubmit, children }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${visible ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title" dangerouslySetInnerHTML={{ __html: title }}></span>
                    <button className="modal-close" type="button" onClick={onClose}>✕</button>
                </div>
                <form
                    id="modal-form"
                    className="modal-body"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.target);
                        const data = Object.fromEntries(fd.entries());
                        if (onSubmit) onSubmit(data);
                        onClose();
                    }}
                >
                    {children}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ConfirmModal({ isOpen, message, onClose, onConfirm }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) requestAnimationFrame(() => setVisible(true));
        else setVisible(false);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${visible ? 'visible' : ''}`} onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">⚠️ Confirm</span>
                    <button className="modal-close" type="button" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} dangerouslySetInnerHTML={{ __html: message }}></p>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
