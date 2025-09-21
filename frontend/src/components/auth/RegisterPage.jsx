import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { Button, Input } from '../atlassian-ui';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('开始注册流程...');

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('密码不匹配');
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.email || !formData.password) {
      setError('请填写邮箱和密码');
      setIsLoading(false);
      return;
    }

    // Prepare registration data
    const registrationData = {
      email: formData.email.trim(),
      password: formData.password,
      full_name: formData.full_name?.trim() || null,
    };

    console.log('提交注册数据:', registrationData);

    try {
      const result = await register(registrationData);
      console.log('注册结果:', result);
      
      if (result.success) {
        console.log('注册成功，跳转到主页...');
        navigate('/app');
      } else {
        console.error('注册失败:', result.error);
        setError(result.error || '注册失败，请重试');
      }
    } catch (error) {
      console.error('注册过程中发生错误:', error);
      setError('注册过程中发生错误，请重试');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-notion-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-notion-dark">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-notion-gray">
            Start your AI-powered note-taking journey
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Full name (optional)"
              value={formData.full_name}
              onChange={(e) => handleChange(e)}
              name="full_name"
              leftIcon={<User className="h-5 w-5" />}
            />
            
            <Input
              label="Email address"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => handleChange(e)}
              name="email"
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />
            
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => handleChange(e)}
              name="password"
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              }
              required
            />
            
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange(e)}
              name="confirmPassword"
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  aria-label={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              }
              required
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="large"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>

          <div className="text-center">
            <span className="text-sm text-notion-gray">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
