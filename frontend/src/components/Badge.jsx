import React from 'react';

export default function Badge({ status, type }) {
  let className = 'badge-slate';
  const val = (status || type || '').toUpperCase();

  if (['PENDING', 'ACTIVE', 'HIGH', 'URGENT'].includes(val)) {
    className = val === 'HIGH' || val === 'URGENT' ? 'badge-rose' : 'badge-amber';
  } else if (['RESOLVED', 'COMPLETED', 'ACTIVE', 'LOW', 'ONLINE'].includes(val)) {
    className = 'badge-emerald';
  } else if (['CONTACTED', 'IN_PROGRESS', 'MEDIUM', 'SOFTWARE'].includes(val)) {
    className = 'badge-cyan';
  } else if (['HARDWARE', 'INFO'].includes(val)) {
    className = 'badge-blue';
  }

  return (
    <span className={`badge ${className}`}>
      {val}
    </span>
  );
}
