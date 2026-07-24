'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import React from 'react';

// Dynamically import swagger-ui-react to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '20px' }}>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}
