/*
 * Copyright 2019 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Meter } from 'grommet';
import * as React from 'react';
import { Badge, Heading, Modal, Table } from 'rendition';

import { getDrives } from '../../models/available-drives';
import { getDriveImageCompatibilityStatuses } from '../../modules/drive-constraints';
import {
  deselectDrive,
  getImage,
  getSelectedDrives,
  isDriveSelected,
  selectDrive,
} from '../../models/selection-state';
import { subscribe } from '../../models/store';
import { ThemedProvider } from '../../styled-components';
import { bytesToClosestUnit } from '../../modules/units';

interface Drive {
  description: string;
  device: string;
  isSystem: boolean;
  isReadOnly: boolean;
  progress?: number;
  size?: number;
  link?: string;
  linkCTA?: string;
  displayName: string;
}

interface Image {
  path: string;
  size: number;
  url: string;
  name: string;
  supportUrl: string;
  recommendedDriveSize: number;
}

interface CompatibilityStatus {
  type: number;
  message: string;
}

interface DriveSelectorProps {
  unique: boolean;  // TODO
}

interface DriveSelectorState {
  open: boolean;
  drives: Drive[];
  image: Image;
  selectedDrivesCount: number;
}


// TODO: no hardcoded size
const modalStyle = {
  width: '800px',
  height: '600px',
  paddingTop: '20px',
  paddingLeft: '30px',
  paddingRight: '30px',
  paddingBottom: '11px',
}

const titleStyle = {
  color: '#2a506f',
}

const subtitleStyle = {
  marginLeft: '10px',
  fontSize: '11px',
  color: '#5b82a7',
};

const wrapperStyle = {
  height: '250px',
  overflowX: 'hidden' as 'hidden',
  overflowY: 'auto' as 'auto',
}

export class DriveSelector2 extends React.Component<DriveSelectorProps, DriveSelectorState> {
  private table: React.RefObject<Table<Drive>>;
  private columns: any;  // TODO

  constructor(props: DriveSelectorProps) {
    super(props);
    this.columns = [
      {
        field: 'description',
        label: 'Name',
      } as const,
      {
        field: 'size',
        label: 'Size',
        render: this.renderSize.bind(this),
      } as const,
      {
        field: 'displayName',
        label: 'Location',
        render: this.renderLocation.bind(this),
      } as const,
      {
        field: 'isReadOnly',  // We don't use this, but a valid field that is not used in another column is required
        label: ' ',
        render: this.renderBadges.bind(this),
      } as const,
    ];
    this.state = {
      drives: getDrives(),
      selectedDrivesCount: getSelectedDrives().length,
      image: getImage(),
      open: true,
    };
    this.table = React.createRef();
    subscribe(() => {
      const drives: Drive[] = getDrives();
      for (let i = 0; i < drives.length; i++) {
        drives[i] = {...drives[i]};
      }
      const selected = drives.filter(d => isDriveSelected(d.device));
      this.setState({
        drives,
        selectedDrivesCount: selected.length,
        image: getImage(),
      });
      if (this.table.current != null) {
        this.table.current.setRowSelection(selected);
      }
    });
  }

  private renderSize(size: number) {
    if (size) {
      return bytesToClosestUnit(size);
    } else {
      return null;
    }
  }

  private renderLocation(displayName: string, drive: Drive) {
    const result: Array<string | JSX.Element> = [displayName];
    if (drive.link && drive.linkCTA) {
      result.push(<a href={drive.link}>{drive.linkCTA}</a>);
    }
    return <React.Fragment>{result}</React.Fragment>;
  }

  private renderBadges(_value: any, row: Drive) {
    const result = [];
    if (row.progress !== undefined) {
      result.push(<Meter
        size="small"
        thickness="xxsmall"
        values={
          [
            {
              value: row.progress,
              label: row.progress + '%',
              color: '#2297de',
            }
          ]
        }
        />);
    }
    result.push(...getDriveImageCompatibilityStatuses(row, this.state.image).map((status: CompatibilityStatus) => {  // TODO: badge color
      return <Badge xsmall>{status.message}</Badge>
    }))
    // TODO: drive contains source mountpoint
    // TODO: large drive
    return <React.Fragment>{result}</React.Fragment>;
  }

  private renderTbodyPrefix() {
    if (this.state.drives.length === 0) {
      return <tr>
        <td
          colSpan={this.columns.length}
          style={{ textAlign: 'center' }}
        >
          <b>Connect a drive</b>
          <div>No removable drive detected.</div>
        </td>
      </tr>
    }
  }

  public render() {
    console.log('render', this.state.drives.map(d => d.device));
    if (this.state.open) {
      return <ThemedProvider>
        <Modal
          titleElement={
            <Heading.h3 style={titleStyle}>
              Available targets
              <span style={subtitleStyle}>
                {this.state.drives.length} found
              </span>
            </Heading.h3>
          }
          action={`Select (${this.state.selectedDrivesCount})`}
          style={modalStyle}
          done={() => {this.setState({open: false})}}
        >
          <div style={wrapperStyle}>
            <Table<Drive>
              ref={this.table}
              rowKey='device'
              onCheck={this.onCheck}
              columns={this.columns}
              data={this.state.drives}
              tbodyPrefix={this.renderTbodyPrefix()}
            >
            </Table>
          </div>
        </Modal>
      </ThemedProvider>
    } else {
      return null;
    }
  }

  private onCheck(checkedDrives: Drive[]): void {
    const checkedDevices = checkedDrives.map(d => d.device);
    for (const drive of getDrives()) {
      if (checkedDevices.indexOf(drive.device) !== -1) {
        selectDrive(drive.device);
      } else {
        deselectDrive(drive.device);
      }
    }
  }
}
