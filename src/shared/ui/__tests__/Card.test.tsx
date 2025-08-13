import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('should render with title', () => {
    render(<Card title="Test Title">Test content</Card>);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render without title', () => {
    render(<Card>Test content only</Card>);
    
    expect(screen.getByText('Test content only')).toBeInTheDocument();
  });

  it('should apply additional className', () => {
    const { container } = render(
      <Card title="Test" className="custom-class">
        Content
      </Card>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle empty children', () => {
    render(<Card title="Empty" />);
    
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});