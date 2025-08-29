import { config } from './config'

const API_BASE_URL = config.api.baseUrl

interface ApiResponse<T = any> {
  success: boolean
  status: number
  data: T
  message: string
  errorData?: {
    errorCode: string
    errorMessage: string
    details: string
  }
  pageableResponse?: {
    total: number
    current: number
    totalPages: number
    perPages: number
  }
}

interface LoginRequest {
  phoneNumber: string
}

interface VerifyRequest {
  phoneNumber: string
  code: string
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  role: string[]
}

interface UserProfile {
  id: number
  fullName: string
  phoneNumber: string
}

interface TestTemplate {
  id: string
  title: string
  duration: number
  price: number
  subjects: Array<{
    subject: {
      id: number
      name: string
      calculator: boolean
      imageUrl: string
    }
    role: string
  }>
  questions?: Array<{
    id: number
    testSubjectId: number
    questionType: string
    writtenAnswer: string
    questionText: string
    imageUrl: string
    youtubeUrl: string
    position: string
    options: Array<{
      id: number
      questionId: number
      answerText: string
      imageUrl: string
      isCorrect: boolean
    }>
  }>
}

interface Question {
  id: number
  testSubjectId: number
  questionType: string
  writtenAnswer: string
  questionText: string
  imageUrl: string
  youtubeUrl: string
  position: string
  options: QuestionOption[]
}

interface QuestionOption {
  id: number
  questionId: number
  answerText: string
  imageUrl: string
  isCorrect: boolean
}

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders: { 'Content-Type': string; [key: string]: string } = {
      'Content-Type': 'application/json',
    }

    // Add authorization header if token exists
    const token = localStorage.getItem('accessToken')
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response) {
        throw new Error(data.message || 'API request failed')
      }

      return data
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Authentication methods
  async login(phoneNumber: string): Promise<ApiResponse<boolean>> {
    return this.request<boolean>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    })
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    })
  }

  async refreshToken(token: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>(`/api/auth/refresh-token?token=${token}`, {
      method: 'GET',
    })
  }

  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/api/auth/me', {
      method: 'GET',
    })
  }

  // Token management
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken')
  }

  clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('admin_authenticated')
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }

  // Check if API is available
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, { method: 'GET' })
      return response.ok
    } catch {
      return false
    }
  }

  // Auto refresh token when it expires
  async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return false
    }

    try {
      const response = await this.refreshToken(refreshToken)
      if (response.success && response.data) {
        this.setTokens(response.data.accessToken, response.data.refreshToken)
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearTokens()
    }

    return false
  }

  // Test Templates methods
  async getTestTemplates(): Promise<ApiResponse<TestTemplate[]>> {
    try {
      // Get main subjects first to get subject IDs
      const mainSubjectsResponse = await this.request<{id: number, name: string}[]>('/api/template/mainSubjects', {
        method: 'GET',
      })
      
      if (!mainSubjectsResponse.success) {
        throw new Error('Failed to fetch main subjects')
      }
      
      // Fetch templates for each subject
      const allTemplates: TestTemplate[] = []
      
      for (const subject of mainSubjectsResponse.data) {
        try {
          const templatesResponse = await this.request<TestTemplate[]>(`/api/template/all/${subject.id}?page=0&size=100`, {
            method: 'GET',
          })
          
          if (templatesResponse.success && templatesResponse.data) {
            // Map the API response to match our interface
            const mappedTemplates = templatesResponse.data.map(template => ({
              id: template.id.toString(),
              title: template.title,
              duration: template.duration || 60,
              price: template.price || 0,
              subjects: [{
                subject: {
                  id: subject.id,
                  name: subject.name,
                  calculator: false, // Default value
                  imageUrl: ""
                },
                role: "MAIN"
              }]
            }))
            allTemplates.push(...mappedTemplates)
          }
        } catch (error) {
          console.warn(`Failed to fetch templates for subject ${subject.id}:`, error)
        }
      }
      
      return {
        success: true,
        status: 200,
        data: allTemplates,
        message: 'Templates loaded successfully'
      }
    } catch (error) {
      throw new Error('Failed to fetch test templates')
    }
  }

  async createTestTemplate(data: {
    title: string
    duration: number
    price: number
    testSubjectsAndQuestions: Array<{
      subjectId: number
      subjectRole: string
      testQuestions: Array<{
        questionType: string
        questionText: string
        writtenAnswer: string
        imageUrl: string
        youtubeUrl: string
        position: string
        options: Array<{
          answerText: string
          imageUrl: string
          isCorrect: boolean
        }>
      }>
    }>
  }): Promise<ApiResponse<TestTemplate>> {
    try {
      const response = await this.request<TestTemplate>('/api/template/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      
      if (response.success) {
        // Map the response to match our interface
        const mappedTemplate: TestTemplate = {
          id: response.data.id.toString(),
          title: response.data.title || data.title,
          duration: response.data.duration || data.duration,
          price: response.data.price || data.price,
          subjects: response.data.subjects || []
        }
        
        return {
          ...response,
          data: mappedTemplate
        }
      }
      
      return response
    } catch (error) {
      throw new Error('Failed to create test template')
    }
  }

  async getTestTemplateById(id: string): Promise<ApiResponse<TestTemplate>> {
    try {
      // Try to get template with questions first
      let response = await this.request<TestTemplate>(`/api/template/getWithQuestions/${id}`, {
        method: 'GET',
      })
      
      if (!response.success) {
        // Fallback to template without questions
        response = await this.request<TestTemplate>(`/api/template/getWithoutQuestions/${id}`, {
          method: 'GET',
        })
      }
      
      if (response.success) {
        // Map the response to match our interface
        const mappedTemplate: TestTemplate = {
          id: response.data.id.toString(),
          title: response.data.title || 'Untitled Template',
          duration: response.data.duration || 60,
          price: response.data.price || 0,
          subjects: response.data.subjects || []
        }
        
        return {
          ...response,
          data: mappedTemplate
        }
      }
      
      return response
    } catch (error) {
      throw new Error('Failed to fetch test template')
    }
  }

  async updateTestTemplate(id: string, data: {
    title: string
    duration: number
    price: number
    testSubjectsAndQuestions: Array<{
      subjectId: number
      subjectRole: string
      testQuestions: Array<{
        questionType: string
        questionText: string
        writtenAnswer: string
        imageUrl: string
        youtubeUrl: string
        position: string
        options: Array<{
          answerText: string
          imageUrl: string
          isCorrect: boolean
        }>
      }>
    }>
  }): Promise<ApiResponse<TestTemplate>> {
    try {
      const response = await this.request<TestTemplate>(`/api/template/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      
      if (response.success) {
        // Map the response to match our interface
        const mappedTemplate: TestTemplate = {
          id: response.data.id.toString(),
          title: response.data.title || data.title,
          duration: response.data.duration || data.duration,
          price: response.data.price || data.price,
          subjects: response.data.subjects || []
        }
        
        return {
          ...response,
          data: mappedTemplate
        }
      }
      
      return response
    } catch (error) {
      throw new Error('Failed to update test template')
    }
  }

  async deleteTestTemplate(id: string): Promise<ApiResponse<boolean>> {
    try {
      return await this.request<boolean>(`/api/template/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw new Error('Failed to delete test template')
    }
  }

  // Upload image for template
  async uploadTemplateImage(file: File): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await this.request<string>('/api/template/image/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Remove Content-Type header for FormData
          'Content-Type': undefined as any,
        },
      })
      
      return response
    } catch (error) {
      throw new Error('Failed to upload template image')
    }
  }

  // Get main subjects for templates
  async getMainSubjects(): Promise<ApiResponse<{id: number, name: string}[]>> {
    try {
      return await this.request<{id: number, name: string}[]>('/api/template/mainSubjects', {
        method: 'GET',
      })
    } catch (error) {
      throw new Error('Failed to fetch main subjects')
    }
  }

  // Questions methods
  async getQuestions(): Promise<ApiResponse<Question[]>> {
    try {
      return await this.request<Question[]>('/api/questions', {
        method: 'GET',
      })
    } catch (error) {
      throw new Error('Failed to fetch questions')
    }
  }

  async getQuestionById(id: number): Promise<ApiResponse<Question>> {
    try {
      return await this.request<Question>(`/api/questions/${id}`, {
        method: 'GET',
      })
    } catch (error) {
      throw new Error('Failed to fetch question')
    }
  }

  async createQuestion(data: Partial<Question>): Promise<ApiResponse<Question>> {
    try {
      return await this.request<Question>('/api/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error('Failed to create question')
    }
  }

  async updateQuestion(id: number, data: Partial<Question>): Promise<ApiResponse<Question>> {
    try {
      return await this.request<Question>(`/api/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error('Failed to update question')
    }
  }

  async deleteQuestion(id: number): Promise<ApiResponse<boolean>> {
    try {
      return await this.request<boolean>(`/api/questions/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw new Error('Failed to delete question')
    }
  }

  // Subjects methods
  async getSubjects(): Promise<ApiResponse<Subject[]>> {
    try {
      return await this.request<Subject[]>('/api/subject/all?page=0&size=100', {
        method: 'GET',
      })
    } catch (error) {
      throw new Error('Failed to fetch subjects')
    }
  }

  async createSubject(data: Partial<Subject>): Promise<ApiResponse<Subject>> {
    try {
      return await this.request<Subject>('/api/subject/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error('Failed to create subject')
    }
  }

  async getSubjectById(id: number): Promise<ApiResponse<Subject>> {
    try {
      return await this.request<Subject>(`/api/subject/${id}`, {
        method: 'GET',
      })
    } catch (error) {
      throw new Error('Failed to fetch subject')
    }
  }

  async updateSubject(id: number, data: Partial<Subject>): Promise<ApiResponse<Subject>> {
    try {
      return await this.request<Subject>(`/api/subject/update/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error('Failed to update subject')
    }
  }

  async deleteSubject(id: number): Promise<ApiResponse<boolean>> {
    try {
      return await this.request<boolean>(`/api/subject/delete/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      throw new Error('Failed to delete subject')
    }
  }

  // Upload image for subject
  async uploadSubjectImage(file: File): Promise<ApiResponse<string>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await this.request<string>('/api/subject/image/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Remove Content-Type header for FormData
          'Content-Type': undefined as any,
        },
      })
      
      return response
    } catch (error) {
      throw new Error('Failed to upload subject image')
    }
  }
  async getSubjectsForTemplates(): Promise<ApiResponse<Subject[]>> {
    try {
      return await this.request<Subject[]>('/api/template/mainSubjects', {
        method: 'GET',
      })
    }
    catch (error) {
      throw new Error('Failed to fetch subjects for templates')
    }
  }
  async getUsers(): Promise<ApiResponse<UserProfile[]>> {
    try {
      return await this.request<UserProfile[]>('/api/access/users?page=0&size=999999', {
        method: 'GET',
      })
    }
    catch (error) {
      throw new Error('Failed to fetch users')
    }
  }

  async getUserAccess(userId: string): Promise<ApiResponse<any>> {
    try {
      return await this.request<any>(`/api/access/user/${userId}`, {
        method: 'GET',
      })
    }
    catch (error) {
      throw new Error('Failed to fetch user access')
    }
  }

  async updateUser(userId: string, data: { fullName: string; phoneNumber: string }): Promise<ApiResponse<UserProfile>> {
    try {
      return await this.request<UserProfile>(`/api/access/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    }
    catch (error) {
      throw new Error('Failed to update user')
    }
  }

  // Test access management
  async grantTestAccess(userId: string, templateId: string): Promise<ApiResponse<any>> {
    try {
      return await this.request<any>(`/api/access/access/${userId}/${templateId}`, {
        method: 'PUT',
      })
    }
    catch (error) {
      throw new Error('Failed to grant test access')
    }
  }

  async revokeTestAccess(userId: string, templateId: string): Promise<ApiResponse<any>> {
    try {
      return await this.request<any>(`/api/access/unaccess/${userId}/${templateId}`, {
        method: 'PUT',
      })
    }
    catch (error) {
      throw new Error('Failed to revoke test access')
    }
  }

}

// Create and export a singleton instance
export const apiService = new ApiService()

// Export types for use in components
export type { 
  ApiResponse, 
  LoginRequest, 
  VerifyRequest, 
  AuthResponse, 
  UserProfile,
  TestTemplate,
  Question,
  QuestionOption,
  Subject
}
