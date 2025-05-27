const { dbAsync } = require('./db');

class Mapping {
  // 创建新映射
  static async create(data) {
    const { id, url, expiresAt, isWechat = 0, wechatData = null, customData = null } = data;
    const createdAt = Date.now();
    
    const sql = `
      INSERT INTO mappings (id, url, created_at, expires_at, is_wechat, wechat_data, custom_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [id, url, createdAt, expiresAt, isWechat, wechatData, customData];
    
    try {
      const result = await dbAsync.run(sql, params);
      return { id, url, createdAt, expiresAt, isWechat, wechatData, customData };
    } catch (error) {
      console.error('创建映射错误:', error);
      throw error;
    }
  }
  
  // 通过ID获取映射
  static async getById(id) {
    const sql = 'SELECT * FROM mappings WHERE id = ?';
    
    try {
      const mapping = await dbAsync.get(sql, [id]);
      return mapping;
    } catch (error) {
      console.error('获取映射错误:', error);
      throw error;
    }
  }
  
  // 获取所有映射（支持分页）
  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT * FROM mappings
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    try {
      const mappings = await dbAsync.all(sql, [limit, offset]);
      const countSql = 'SELECT COUNT(*) as total FROM mappings';
      const { total } = await dbAsync.get(countSql);
      
      return {
        mappings,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('获取所有映射错误:', error);
      throw error;
    }
  }
  
  // 更新映射
  static async update(id, data) {
    const { url, expiresAt, isWechat, wechatData, customData } = data;
    
    let sql = 'UPDATE mappings SET ';
    const updates = [];
    const params = [];
    
    if (url !== undefined) {
      updates.push('url = ?');
      params.push(url);
    }
    
    if (expiresAt !== undefined) {
      updates.push('expires_at = ?');
      params.push(expiresAt);
    }
    
    if (isWechat !== undefined) {
      updates.push('is_wechat = ?');
      params.push(isWechat);
    }
    
    if (wechatData !== undefined) {
      updates.push('wechat_data = ?');
      params.push(wechatData);
    }
    
    if (customData !== undefined) {
      updates.push('custom_data = ?');
      params.push(customData);
    }
    
    if (updates.length === 0) {
      return await this.getById(id); // 没有更新，返回当前数据
    }
    
    sql += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    try {
      await dbAsync.run(sql, params);
      return await this.getById(id);
    } catch (error) {
      console.error('更新映射错误:', error);
      throw error;
    }
  }
  
  // 删除映射
  static async delete(id) {
    const sql = 'DELETE FROM mappings WHERE id = ?';
    
    try {
      const result = await dbAsync.run(sql, [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('删除映射错误:', error);
      throw error;
    }
  }
  
  // 获取过期映射
  static async getExpired() {
    const now = Date.now();
    const sql = 'SELECT * FROM mappings WHERE expires_at < ? AND expires_at IS NOT NULL';
    
    try {
      return await dbAsync.all(sql, [now]);
    } catch (error) {
      console.error('获取过期映射错误:', error);
      throw error;
    }
  }
  
  // 获取即将过期的映射（默认2天内）
  static async getExpiringSoon(days = 2) {
    const now = Date.now();
    const future = now + (days * 24 * 60 * 60 * 1000);
    
    const sql = `
      SELECT * FROM mappings 
      WHERE expires_at BETWEEN ? AND ? 
      AND expires_at IS NOT NULL
    `;
    
    try {
      return await dbAsync.all(sql, [now, future]);
    } catch (error) {
      console.error('获取即将过期映射错误:', error);
      throw error;
    }
  }
  
  // 获取微信二维码映射
  static async getWechatMappings() {
    const sql = 'SELECT * FROM mappings WHERE is_wechat = 1';
    
    try {
      return await dbAsync.all(sql);
    } catch (error) {
      console.error('获取微信映射错误:', error);
      throw error;
    }
  }
}

module.exports = Mapping;