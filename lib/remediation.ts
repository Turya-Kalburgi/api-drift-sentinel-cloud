export interface DifferenceItem {
  action: string;
  code: string;
  location?: string;
  remediation?: string;
}

export function generateRemediation(diff: DifferenceItem): string {
  const code = diff.code || '';
  const action = (diff.action || '').toLowerCase();
  const loc = diff.location || 'specification';

  if (code.includes('property.missing') || action === 'remove') {
    return `Non-Breaking Fix: Avoid removing this field directly. Add 'deprecated: true' to the OpenAPI schema at '${loc}', retain the field for existing consumers, and introduce the replacement field in parallel.`;
  }

  if (code.includes('type.mismatch') || action === 'type_change') {
    return `Non-Breaking Fix: Changing property types breaks downstream client deserializers. Keep the legacy type at '${loc}' and support dynamic coercion, or version the endpoint to /v2.`;
  }

  if (code.includes('required') || action === 'add_required') {
    return `Non-Breaking Fix: Making a new property mandatory at '${loc}' rejects older requests. Make the property optional with a safe fallback default value.`;
  }

  return `Non-Breaking Fix: Ensure changes at '${loc}' follow semantic versioning. Add a non-breaking fallback or deprecate across a 2-release grace period.`;
}

export function enrichDifferencesWithRemediations(differences: DifferenceItem[]): DifferenceItem[] {
  return differences.map((diff) => ({
    ...diff,
    remediation: diff.remediation || generateRemediation(diff),
  }));
}
