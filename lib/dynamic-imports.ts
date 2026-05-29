// ✅ Dynamic imports for heavy libraries - reduces bundle by ~150KB
// Only loads when actually needed

export const dynamicImports = {
  // Lazy load jsPDF for PDF generation (used only in export features)
  jsPDF: () => import('jspdf').then(m => m.default),
  jsPDFAutoTable: () => import('jspdf-autotable'),
  
  // Lazy load xlsx for Excel operations (used only in import/export)
  xlsx: () => import('xlsx'),
  
  // Lazy load Recharts components (used only on dashboards)
  recharts: () => import('recharts'),
}

// Helper function to load dependencies on demand
export async function loadDependency(name: keyof typeof dynamicImports) {
  try {
    return await dynamicImports[name]()
  } catch (error) {
    console.error(`Failed to load ${name}:`, error)
    throw error
  }
}
