import React from 'react';
import { CaseEvent } from '../../types';
import { FileMovementTimeline } from '../files/FileMovementTimeline';

export const CaseTimeline: React.FC<{ events: CaseEvent[] }> = ({ events }) => {
  return <FileMovementTimeline events={events} />;
};
