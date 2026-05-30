import styled from 'styled-components';

const Label = styled.label`
  position: relative;
  width: 32px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  input {
    display: none;
  }
`;

const Track = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 9px;
  background: ${({ theme }) => theme.subtle};
  transition: background 0.2s;
  input:checked + & {
    background: #1e40af;
  }
`;

const Knob = styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  input:checked ~ & {
    transform: translateX(14px);
  }
`;

export default function Toggle({ checked, onChange, title }) {
  return (
    <Label title={title}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <Track />
      <Knob />
    </Label>
  );
}
