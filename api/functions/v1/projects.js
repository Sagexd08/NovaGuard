const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// In-memory storage for development (fallback when Supabase is not available)
let inMemoryProjects = [];
let projectIdCounter = 1;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get user ID from Authorization header (Clerk JWT)
    const authHeader = req.headers.authorization;
    let userId = 'anonymous';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you'd verify the JWT token here
      // For now, we'll extract a mock user ID
      userId = 'user_' + Math.random().toString(36).substring(2, 15);
    }

    if (req.method === 'GET') {
      // Get user's projects from Supabase or in-memory storage
      let projects;
      try {
        const { data, error } = await supabase
          .from('audits')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        projects = data;
      } catch (supabaseError) {
        console.log('Supabase not available, using in-memory storage:', supabaseError.message);

        // Fallback to in-memory storage
        projects = inMemoryProjects.filter(p => p.user_id === userId)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }

      // Transform to frontend format
      const transformedProjects = (projects || []).map(project => ({
        id: project.id,
        name: project.project_name || `Contract ${project.contract_address?.substring(0, 8)}`,
        description: project.project_description,
        user_id: project.user_id,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
        project_data: {
          contractAddress: project.contract_address,
          chain: project.chain,
          analysisResults: project.analysis_results
        },
        status: project.status || 'completed',
        type: 'contract'
      }));

      res.json(transformedProjects);

    } else if (req.method === 'POST') {
      console.log('Received project creation request:', req.body);

      const { name, description, type, template, network, contract_code, project_data } = req.body;

      // Validate request
      if (!name) {
        return res.status(400).json({
          error: 'Project name is required'
        });
      }

      // Create project record
      const projectData = {
        user_id: userId,
        project_name: name,
        project_description: description,
        contract_code: contract_code,
        chain: network || 'ethereum',
        analysis_results: null, // Will be filled when audit is run
        status: 'draft',
        created_at: new Date().toISOString(),
        project_metadata: project_data
      };

      let project;
      try {
        const { data, error: projectError } = await supabase
          .from('audits')
          .insert(projectData)
          .select()
          .single();

        if (projectError) {
          throw projectError;
        }
        project = data;
      } catch (supabaseError) {
        console.log('Supabase not available, using in-memory storage:', supabaseError.message);

        // Fallback to in-memory storage
        project = {
          id: `project_${projectIdCounter++}`,
          ...projectData
        };
        inMemoryProjects.push(project);
      }

      // Transform to frontend format
      const transformedProject = {
        id: project.id,
        name: project.project_name,
        description: project.project_description,
        user_id: project.user_id,
        created_at: project.created_at,
        updated_at: project.updated_at || project.created_at,
        project_data: {
          contractCode: project.contract_code,
          chain: project.chain,
          template: project_data?.template,
          category: project_data?.category,
          network: project_data?.network,
          files: project_data?.files
        },
        status: project.status,
        type: type || 'contract'
      };

      console.log('Project created successfully:', transformedProject);
      res.json({
        success: true,
        project: transformedProject
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
