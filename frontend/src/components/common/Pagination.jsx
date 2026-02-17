import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn-glass"
                style={{
                    padding: '0.5rem',
                    borderRadius: '50%',
                    opacity: currentPage === 1 ? 0.3 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <ChevronLeft size={20} />
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    

                    let show = false;
                    if (totalPages <= 7) show = true;
                    else if (page === 1 || page === totalPages) show = true;
                    else if (page >= currentPage - 1 && page <= currentPage + 1) show = true;

                    if (!show) 
                    {
                        return null;
                    }

                    return (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            style={{
                                width: '35px', height: '35px', borderRadius: '10px',
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: currentPage === page ? 'var(--primary)' : 'var(--card-hover-bg)',
                                color: currentPage === page ? 'white' : 'var(--text-secondary)',
                                fontWeight: '600', transition: 'all 0.2s'
                            }}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn-glass"
                style={{
                    padding: '0.5rem',
                    borderRadius: '50%',
                    opacity: currentPage === totalPages ? 0.3 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
