import { Box, Tab, Tabs } from '@mui/material';
import React, {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface TabData {
  icon: ReactElement;
  child: ReactNode;
}

export interface TabbedPaneProps {
  tabs: [TabData, ...TabData[]];
}

export const TabbedPane: React.FC<TabbedPaneProps> = ({ tabs }) => {
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => setTabIndex(0), [tabs, setTabIndex]);
  const tabContents = useMemo(() => tabs[tabIndex].child, [tabs, tabIndex]);
  const hasMultipleTabs = useMemo(() => tabs.length > 1, [tabs]);

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      height={'100%'}
      width={'100%'}
      gap={'8px'}
    >
      {hasMultipleTabs && (
        <Tabs
          value={tabIndex}
          onChange={(_, newTabIndex) => setTabIndex(newTabIndex)}
          variant={'fullWidth'}
        >
          {...tabs.map((data, index) => <Tab key={index} icon={data.icon} />)}
        </Tabs>
      )}

      {tabContents}
    </Box>
  );
};
