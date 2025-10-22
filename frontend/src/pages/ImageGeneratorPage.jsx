import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Edit3, Download, Loader } from 'lucide-react';
import { useToast } from '../components/common/Toast';

// 使用环境变量配置API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ImageGeneratorPage = () => {
  const [mode, setMode] = useState('generate'); // 'generate' or 'edit'
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const toast = useToast();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast?.error('请输入图像描述');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/nano-banana/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt || null,
          num_images: numImages,
          width: 1024,
          height: 1024
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '生成图像失败');
      }

      const data = await response.json();
      setGeneratedImages(data.images.map(img => `data:image/jpeg;base64,${img}`));
      toast?.success(`成功生成 ${data.images.length} 张图像`);
    } catch (error) {
      toast?.error(error.message);
      console.error('生成图像错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!selectedImage || !editPrompt.trim()) {
      toast?.error('请选择图像并输入编辑指令');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 从data URL中提取base64数据
      const base64Data = selectedImage.split(',')[1];

      const response = await fetch(`${API_BASE_URL}/api/nano-banana/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_base64: base64Data,
          prompt: editPrompt
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '编辑图像失败');
      }

      const data = await response.json();
      const editedImage = `data:image/jpeg;base64,${data.images[0]}`;
      setGeneratedImages([editedImage, ...generatedImages]);
      toast?.success('图像编辑成功');
    } catch (error) {
      toast?.error(error.message);
      console.error('编辑图像错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl, index) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `nano-banana-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Nano Banana 图像生成器
            </h1>
          </div>
          <p className="text-gray-600">
            基于 Google Gemini 2.5 Flash 的强大图像生成和编辑功能
          </p>
        </motion.div>

        {/* 模式切换 */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setMode('generate')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'generate'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-5 h-5 inline mr-2" />
            生成图像
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'edit'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Edit3 className="w-5 h-5 inline mr-2" />
            编辑图像
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            {mode === 'generate' ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">生成新图像</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      图像描述 *
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="描述你想要生成的图像，例如：一只可爱的猫咪坐在月球上，背景是星空..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      负面提示词（可选）
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="不想在图像中出现的内容，例如：模糊、低质量..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生成数量: {numImages}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={numImages}
                      onChange={(e) => setNumImages(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1张</span>
                      <span>4张</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateImage}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 inline mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 inline mr-2" />
                        生成图像
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">编辑图像</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择要编辑的图像
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                      {generatedImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Generated ${idx + 1}`}
                          onClick={() => setSelectedImage(img)}
                          className={`cursor-pointer rounded-lg hover:opacity-75 transition-all ${
                            selectedImage === img ? 'ring-4 ring-purple-500' : ''
                          }`}
                        />
                      ))}
                      {generatedImages.length === 0 && (
                        <p className="col-span-3 text-center text-gray-500 py-8">
                          请先生成图像
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      编辑指令 *
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="描述你想如何修改图像，例如：将背景改为森林..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <button
                    onClick={handleEditImage}
                    disabled={loading || !selectedImage}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 inline mr-2 animate-spin" />
                        编辑中...
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-5 h-5 inline mr-2" />
                        编辑图像
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* 结果展示区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">生成结果</h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {generatedImages.length > 0 ? (
                generatedImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img}
                      alt={`Generated ${idx + 1}`}
                      className="w-full rounded-xl shadow-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-xl flex items-center justify-center">
                      <button
                        onClick={() => downloadImage(img, idx)}
                        className="opacity-0 group-hover:opacity-100 transition-all bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50"
                      >
                        <Download className="w-5 h-5 inline mr-2" />
                        下载
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p>暂无生成的图像</p>
                  <p className="text-sm mt-2">开始生成你的第一张图像吧！</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 功能说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white rounded-2xl shadow-xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 text-gray-800">功能特性</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-xl">
              <h4 className="font-semibold text-purple-900 mb-2">文本生成图像</h4>
              <p className="text-sm text-gray-700">
                通过自然语言描述，快速生成高质量的图像，支持一次生成多张
              </p>
            </div>
            <div className="p-4 bg-pink-50 rounded-xl">
              <h4 className="font-semibold text-pink-900 mb-2">智能图像编辑</h4>
              <p className="text-sm text-gray-700">
                对已生成的图像进行局部编辑，保持主体一致性，实现精准修改
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-semibold text-blue-900 mb-2">物理感知渲染</h4>
              <p className="text-sm text-gray-700">
                自动处理阴影、反射、纹理等物理效果，让图像更加真实自然
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;
