/**
 * 映射相关路由
 */

const express = require('express');
const router = express.Router();
const Mapping = require('../models/mapping');
const { isAuthenticatedApi } = require('../middleware/auth');
const { generateId, calculateExpiryTimestamp, isValidUrl, safeJsonParse } = require('../utils/helpers');

// 获取所有映射（需要认证）
router.get('/', isAuthenticatedApi, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await Mapping.getAll(page, limit);
    res.json(result);
  } catch (error) {
    console.error('获取映射列表错误:', error);
    res.status(500).json({ error: '获取映射列表失败' });
  }
});

// 创建新映射（需要认证）
router.post('/', isAuthenticatedApi, async (req, res) => {
  try {
    const { url, expiryDays, isWechat, wechatData, customData, customId } = req.body;
    
    // 验证URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'URL无效' });
    }
    
    // 生成或使用自定义ID
    const id = customId || generateId(6);
    
    // 检查ID是否已存在
    const existing = await Mapping.getById(id);
    if (existing) {
      return res.status(409).json({ error: 'ID已存在' });
    }
    
    // 计算过期时间
    const expiresAt = calculateExpiryTimestamp(expiryDays);
    
    // 创建映射
    const mapping = await Mapping.create({
      id,
      url,
      expiresAt,
      isWechat: isWechat ? 1 : 0,
      wechatData: wechatData ? JSON.stringify(wechatData) : null,
      customData: customData ? JSON.stringify(customData) : null
    });
    
    res.status(201).json(mapping);
  } catch (error) {
    console.error('创建映射错误:', error);
    res.status(500).json({ error: '创建映射失败' });
  }
});

// 获取特定映射（公开访问）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mapping = await Mapping.getById(id);
    
    if (!mapping) {
      return res.status(404).json({ error: '映射不存在' });
    }
    
    // 检查是否过期
    if (mapping.expires_at && mapping.expires_at < Date.now()) {
      return res.status(410).json({ error: '映射已过期' });
    }
    
    // 处理微信二维码特殊情况
    if (mapping.is_wechat) {
      const wechatData = safeJsonParse(mapping.wechat_data, {});
      return res.json({
        ...mapping,
        wechat_data: wechatData,
        custom_data: safeJsonParse(mapping.custom_data, null)
      });
    }
    
    // 普通映射直接重定向到目标URL
    res.redirect(mapping.url);
  } catch (error) {
    console.error('获取映射错误:', error);
    res.status(500).json({ error: '获取映射失败' });
  }
});

// 更新映射（需要认证）
router.put('/:id', isAuthenticatedApi, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, expiryDays, isWechat, wechatData, customData } = req.body;
    
    // 检查映射是否存在
    const mapping = await Mapping.getById(id);
    if (!mapping) {
      return res.status(404).json({ error: '映射不存在' });
    }
    
    // 准备更新数据
    const updateData = {};
    
    if (url !== undefined && isValidUrl(url)) {
      updateData.url = url;
    }
    
    if (expiryDays !== undefined) {
      updateData.expiresAt = calculateExpiryTimestamp(expiryDays);
    }
    
    if (isWechat !== undefined) {
      updateData.isWechat = isWechat ? 1 : 0;
    }
    
    if (wechatData !== undefined) {
      updateData.wechatData = JSON.stringify(wechatData);
    }
    
    if (customData !== undefined) {
      updateData.customData = JSON.stringify(customData);
    }
    
    // 更新映射
    const updatedMapping = await Mapping.update(id, updateData);
    
    res.json(updatedMapping);
  } catch (error) {
    console.error('更新映射错误:', error);
    res.status(500).json({ error: '更新映射失败' });
  }
});

// 删除映射（需要认证）
router.delete('/:id', isAuthenticatedApi, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查映射是否存在
    const mapping = await Mapping.getById(id);
    if (!mapping) {
      return res.status(404).json({ error: '映射不存在' });
    }
    
    // 删除映射
    const success = await Mapping.delete(id);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: '删除映射失败' });
    }
  } catch (error) {
    console.error('删除映射错误:', error);
    res.status(500).json({ error: '删除映射失败' });
  }
});

// 获取微信二维码映射（需要认证）
router.get('/wechat/all', isAuthenticatedApi, async (req, res) => {
  try {
    const wechatMappings = await Mapping.getWechatMappings();
    
    // 处理JSON字段
    const formattedMappings = wechatMappings.map(mapping => ({
      ...mapping,
      wechat_data: safeJsonParse(mapping.wechat_data, {}),
      custom_data: safeJsonParse(mapping.custom_data, null)
    }));
    
    res.json(formattedMappings);
  } catch (error) {
    console.error('获取微信映射错误:', error);
    res.status(500).json({ error: '获取微信映射失败' });
  }
});

module.exports = router;