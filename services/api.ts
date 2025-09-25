import { ApiUser, MatchRequest, MatchResponse, SwipeRequest } from '@/types/api';

// API service with real endpoint and mock fallback
class ApiService {
  private readonly API_BASE_URL = 'https://vzr1rz8idc.execute-api.ap-south-1.amazonaws.com/staging';
  
  // Mock data as fallback when CORS fails
  private getMockResponse(request: MatchRequest): MatchResponse {
    return {
      "tags": {
        "all": [
          {
            "id": 1,
            "name": "Feminism",
            "isSelected": request.tagIds.includes(1)
          },
          {
            "id": 2,
            "name": "Mental Health",
            "isSelected": request.tagIds.includes(2)
          },
          {
            "id": 3,
            "name": "Politics",
            "isSelected": request.tagIds.includes(3)
          },
          {
            "id": 4,
            "name": "Climate Change",
            "isSelected": request.tagIds.includes(4)
          },
          {
            "id": 5,
            "name": "LGBTQ+",
            "isSelected": request.tagIds.includes(5)
          }
        ]
      },
      "trendingTags": [
        {
          "id": 4,
          "name": "Climate Change"
        },
        {
          "id": 6,
          "name": "Israel–Iran Conflict"
        },
        {
          "id": 7,
          "name": "AI and Ethics"
        }
      ],
      "matches": this.getFilteredMockMatches(request.tagIds),
      "hasMore": true
    };
  }

  private getFilteredMockMatches(tagIds: number[]) {
    const allMatches = [
      {
        "userId": 203,
        "firstName": "Ishana",
        "age": 25,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 501,
            "question": "What does feminism mean to you in 2025?",
            "answer": "It's about equity, not just equality. Real change means changing systems, not just headlines.",
            "tag": {
              "tagId": 1,
              "tagValue": "Feminism"
            }
          },
          {
            "takeId": 504,
            "question": "How do you handle burnout?",
            "answer": "I unplug, go offline and come back with perspective.",
            "tag": {
              "tagId": 2,
              "tagValue": "Mental Health"
            }
          }
        ]
      },
      {
        "userId": 305,
        "firstName": "Priya",
        "age": 27,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 502,
            "question": "Is therapy a necessity or luxury in India?",
            "answer": "It's a necessity, but access is still a luxury. We need more awareness and affordability.",
            "tag": {
              "tagId": 2,
              "tagValue": "Mental Health"
            }
          }
        ]
      },
      {
        "userId": 218,
        "firstName": "Sana",
        "age": 23,
        "gender": "Female",
        "opinions": [
          {
            "takeId": 503,
            "question": "Do you believe nationalism is hurting India's diversity?",
            "answer": "Yes, because hyper-nationalism silences dissent and erodes cultural pluralism.",
            "tag": {
              "tagId": 3,
              "tagValue": "Politics"
            }
          }
        ]
      },
      {
        "userId": 319,
        "firstName": "Kavya",
        "age": 24,
        "gender": "Female", 
        "opinions": [
          {
            "takeId": 505,
            "question": "What's your take on climate activism?",
            "answer": "We need systemic change, not just individual action. Corporations must be held accountable.",
            "tag": {
              "tagId": 4,
              "tagValue": "Climate Change"
            }
          }
        ]
      }
    ];

    // Filter matches based on selected tag IDs
    if (tagIds.length === 0) return allMatches;
    
    return allMatches.filter(match => 
      match.opinions.some(opinion => 
        tagIds.includes(opinion.tag.tagId)
      )
    );
  }
  
  // API request method with CORS fallback
  private async makeRequest<T>(endpoint: string, data: MatchRequest): Promise<T> {
    try {
      console.log('🌐 Attempting API request to:', `${this.API_BASE_URL}${endpoint}`);
      console.log('📤 Request data:', data);
      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      console.log('✅ Raw API Response received:', apiResponse);
      
      // Check if response has the expected structure
      if (apiResponse.code === 200 && apiResponse.model) {
        // Convert the actual API response to our expected format
        const convertedResponse: MatchResponse = {
          tags: {
            all: apiResponse.model.tags.all
          },
          trendingTags: apiResponse.model.tags.trendingTags || [],
          matches: apiResponse.model.matches.map((match: any) => ({
            userId: match.userId,
            firstName: match.firstName,
            age: 25, // Default age since not provided in API
            gender: "Female", // Default gender since not provided in API
            opinions: match.opinions.map((opinion: any) => ({
              takeId: opinion.takeId,
              question: opinion.question,
              answer: opinion.answer,
              tag: {
                tagId: this.getTagIdFromName(opinion.tag, apiResponse.model.tags.all),
                tagValue: opinion.tag
              }
            }))
          })),
          hasMore: apiResponse.model.hasMore
        };
        
        console.log('🔄 Converted API Response:', convertedResponse);
        return convertedResponse as T;
      } else {
        throw new Error(`API returned error: ${apiResponse.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ API request failed:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('🚫 CORS error detected - falling back to mock data');
        console.warn('💡 API owner needs to enable CORS for:', window.location.origin);
        return this.getMockResponse(data) as T;
      }
      
      throw error;
    }
  }

  // Helper method to get tag ID from tag name
  private getTagIdFromName(tagName: string, allTags: any[]): number {
    const tag = allTags.find(t => t.name === tagName);
    return tag ? tag.id : 1; // Default to 1 if not found
  }

  // Send swipe action to the server
  async sendSwipe(takeId: number, swipeRight: boolean, comment?: string): Promise<boolean> {
    try {
      const swipeData: SwipeRequest = {
        takeId,
        swipeRight,
        ...(comment && comment.trim() && { comment: comment.trim() })
      };

      console.log('🔄 Sending swipe action:', swipeData);
      
      const response = await fetch(`${this.API_BASE_URL}/swipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(swipeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Swipe response:', result);
      
      return true;
    } catch (error) {
      console.error('💥 Failed to send swipe:', error);
      // For now, we'll return true even if the request fails
      // In production, you might want to queue failed requests for retry
      return true;
    }
  }

  // Fetch matches with automatic fallback
  async fetchMatches(request: MatchRequest): Promise<MatchResponse> {
    try {
      const response = await this.makeRequest<MatchResponse>('/home', request);
      return response;
    } catch (error) {
      console.error('💥 Failed to fetch matches:', error);
      // Final fallback
      console.warn('🔄 Using mock data as final fallback');
      return this.getMockResponse(request);
    }
  }

  // Convert API response to app format
  convertToAppUsers(matches: MatchResponse['matches']): ApiUser[] {
    return matches.map(match => ({
      id: match.userId.toString(),
      name: match.firstName,
      age: match.age,
      gender: match.gender,
      photo: `https://picsum.photos/200/200?random=${match.userId}`, // Generate random photo
      opinions: match.opinions.map(opinion => ({
        id: opinion.takeId.toString(),
        question: opinion.question,
        text: opinion.answer,
        theme: opinion.tag.tagValue,
        liked: false
      }))
    }));
  }

  // Get default request for initial load  
  getDefaultRequest(): MatchRequest {
    return {
      userId: 101,
      tagIds: [1, 2, 3], // Default selected tags
      gender: "Female",
      intentions: ["date", "bff"],
      age_min: 21,
      age_max: 30,
      limit: 20
    };
  }
}

export const apiService = new ApiService();
