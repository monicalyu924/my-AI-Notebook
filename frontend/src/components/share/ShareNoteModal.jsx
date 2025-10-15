import React, { useState } from 'react';
import { X, Share2, Copy, Check, Lock, Clock } from 'lucide-react';
import api from '../../utils/api';

/**
 * 笔记分享模态框
 * 生成分享链接并支持权限设置
 */
const ShareNoteModal = ({ note, onClose }) => {
  const [shareLink, setShareLink] = useState(null);
  const [permission, setPermission] = useState('view_only');
  const [expiresIn, setExpiresIn] = useState('never');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateShare = async () => {
    setLoading(true);
    try {
      const expireDate = expiresIn === 'never' ? null :
        expiresIn === '1day' ? new Date(Date.now() + 86400000) :
        expiresIn === '7days' ? new Date(Date.now() + 604800000) :
        new Date(Date.now() + 2592000000);

      const response = await api.post(`/share/notes/${note.id}`, {
        note_id: note.id,
        permission,
        expires_at: expireDate,
        password: password || null
      });

      if (response.data) {
        const link = `${window.location.origin}/shared/${response.data.share_token}`;
        setShareLink(link);
      }
    } catch (error) {
      console.error('生成分享链接失败:', error);
      alert('生成分享链接失败');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">分享笔记</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>{note.title}</strong>
          </div>

          {!shareLink ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">权限</label>
                <select value={permission} onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="view_only">仅查看</option>
                  <option value="can_comment">可评论</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  有效期
                </label>
                <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="never">永久</option>
                  <option value="1day">1天</option>
                  <option value="7days">7天</option>
                  <option value="30days">30天</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  访问密码（可选）
                </label>
                <input type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="留空表示无需密码"
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>

              <button onClick={generateShare} disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? '生成中...' : '生成分享链接'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-2">✓ 分享链接已生成</p>
                <div className="flex gap-2">
                  <input value={shareLink} readOnly
                    className="flex-1 px-3 py-2 bg-white border rounded text-sm" />
                  <button onClick={copyLink}
                    className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              {password && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                  ⚠️ 访问需要密码：{password}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareNoteModal;
