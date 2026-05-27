import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreatorUserResponse, USER_ROLE } from '../type/workflow';

interface UserRow {
  id: string;
  name: string;
  role: string;
}

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  async findCreators(): Promise<CreatorUserResponse[]> {
    const rows = (await this.dataSource.query(
      `SELECT id, name, role
       FROM users
       WHERE role = $1
       ORDER BY name ASC, id ASC`,
      [USER_ROLE.CREATOR],
    )) as UserRow[];

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role as CreatorUserResponse['role'],
    }));
  }
}
