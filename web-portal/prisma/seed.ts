import { config } from 'dotenv'
import { PrismaClient, Job, JobType, JobStatus, AIProvider } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { createClient } from 'redis'

config({ path: '.env.local' })

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
})

redisClient.on('error', (err) => console.error('Redis Client Error', err))

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // Connect to Redis
  if (!redisClient.isOpen) {
    await redisClient.connect()
    console.log('✅ Connected to Redis')
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@career-system.com' },
    update: {},
    create: {
      email: 'admin@career-system.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      phoneNumbers: ['+1 555-0100'],
      bio: 'System administrator managing the career recommendation platform.',
      location: 'Remote',
      website: 'https://career-system.com',
      isActive: true,
    },
  })
  console.log(`✅ Created admin user: ${admin.email}`)

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@career-system.com' },
    update: {},
    create: {
      email: 'user@career-system.com',
      password: userPassword,
      name: 'John Doe',
      role: 'USER',
      phoneNumbers: ['+1 555-0123', '+1 555-0124'],
      bio: 'Passionate software developer with 5 years of experience in full-stack development.',
      location: 'San Francisco, CA',
      website: 'https://johndoe.dev',
      isActive: true,
    },
  })
  console.log(`✅ Created regular user: ${user.email}`)

  // Create career paths
  const careerPaths = [
    {
      id: '27a9d6a8-00d9-4f73-bf69-ec8635c383a9',
      title: 'DevOps Engineer',
      category: 'Tech / Engineering',
      description: 'DevOps engineers bridge the gap between software development and IT operations to streamline code deployments and improve system reliability.',
      requiredSkills: ['CI/CD', 'Docker', 'Kubernetes', 'Linux', 'Python'],
      softSkills: ['Collaboration', 'Adaptability', 'Communication'],
      averageSalary: '$135,980',
      active: true,
    },
    {
      id: '45018e79-074b-4c4d-bf01-9b4420e735a0',
      title: 'UX Designer',
      category: 'Tech / Design',
      description: 'UX designers focus on creating intuitive, accessible, and enjoyable experiences for users interacting with digital products and websites.',
      requiredSkills: ['Wireframing', 'Prototyping', 'Figma', 'User Research', 'Usability Testing'],
      softSkills: ['Empathy', 'Active Listening', 'Critical Thinking'],
      averageSalary: '$98,090',
      active: true,
    },
    {
      id: '5758de7d-227b-42db-9db6-a52f7b550da4',
      title: 'Full Stack Developer',
      category: 'Tech / Software Development',
      description: 'Full stack developers handle both the front-end user interface and the back-end server logic for web and software applications.',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'HTML/CSS'],
      softSkills: ['Time Management', 'Problem Solving', 'Creativity'],
      averageSalary: '$133,080',
      active: true,
    },
    {
      id: '5d387949-c6d6-45c1-b90b-15d873907e21',
      title: 'Software Quality Assurance Analyst',
      category: 'Tech / Quality Assurance',
      description: 'QA analysts test software and applications to identify bugs, ensure quality, and verify that products meet performance standards before launch.',
      requiredSkills: ['Automated Testing', 'Bug Tracking', 'Selenium', 'Python', 'Performance Testing'],
      softSkills: ['Attention to Detail', 'Critical Thinking', 'Communication'],
      averageSalary: '$102,610',
      active: true,
    },
    {
      id: '62c26a7f-5372-463c-ba13-c0b395822907',
      title: 'Data Scientist',
      category: 'Tech / Data',
      description: 'Data scientists analyze and interpret complex datasets to help organizations make data-driven decisions and build predictive models.',
      requiredSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Data Visualization'],
      softSkills: ['Analytical Thinking', 'Problem Solving', 'Communication'],
      averageSalary: '$112,590',
      active: true,
    },
    {
      id: 'b97c7a14-d029-44a1-8a46-d50fca0988c2',
      title: 'Cloud Architect',
      category: 'Tech / Cloud Computing',
      description: 'Cloud architects design, implement, and manage an organization\'s cloud computing infrastructure and strategy to ensure scalability and security.',
      requiredSkills: ['AWS / Azure / GCP', 'Network Design', 'Cloud Security', 'Kubernetes'],
      softSkills: ['Leadership', 'Problem Solving', 'Strategic Thinking'],
      averageSalary: '$130,390',
      active: true,
    },
    {
      id: 'dc232900-e183-483c-ae52-6a9836d7803a',
      title: 'AI & Machine Learning Engineer',
      category: 'Tech / Engineering',
      description: 'AI engineers design, build, and train sophisticated artificial intelligence models and machine learning algorithms that power modern software and tools.',
      requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Natural Language Processing', 'Algorithms'],
      softSkills: ['Adaptability', 'Continuous Learning', 'Problem Solving'],
      averageSalary: '$150,000',
      active: true,
    },
    {
      id: 'fedd04dc-bbe1-4a55-8246-ddfd3d60be32',
      title: 'Information Security Analyst',
      category: 'Tech / Cybersecurity',
      description: 'Security analysts protect an organization\'s computer networks and systems by constantly monitoring for, anticipating, and responding to cyber threats.',
      requiredSkills: ['Network Security', 'Threat Analysis', 'Risk Management', 'Security Auditing'],
      softSkills: ['Analytical Thinking', 'Attention to Detail', 'Stress Management'],
      averageSalary: '$124,910',
      active: true,
    },
  ]

  for (const careerPath of careerPaths) {
    await prisma.careerPath.upsert({
      where: { id: careerPath.id },
      update: careerPath,
      create: careerPath,
    })
    console.log(`✅ Created career path: ${careerPath.title}`)

    // Queue embedding generation job for career path
    await redisClient.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `career_${careerPath.id}`,
      job_type: 'career_embedding',
      career_path_id: careerPath.id,
    }))
    console.log(`📤 Queued embedding job for career: ${careerPath.title}`)
  }

  // Create job postings
  const jobs = [
    {
      id: '059ee5b6-ce92-4999-846a-0b03b2c23570',
      careerPathId: '62c26a7f-5372-463c-ba13-c0b395822907',
      title: 'Junior Data Scientist',
      company: 'DataWorks Analytics',
      location: 'Remote / Chicago, IL',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Join our analytics team to help extract actionable insights from large datasets and build predictive models for retail clients.',
      requirements: ['Python or R', 'SQL proficiency', 'Basic understanding of Machine Learning algorithms', 'B.S. in Computer Science or Statistics'],
      salary: '$95,000',
      salaryRange: '$90,000 - $115,000',
      experienceLevel: 'Entry Level',
      phoneNumbers: ['+1 312-555-0123', '+1 312-555-0124'],
      emails: ['careers@dataworks.com', 'recruiting@dataworks.com'],
      expiresAt: new Date('2026-12-31'),
    },
    {
      id: '5641db69-7be7-4637-a820-a09595fe4365',
      careerPathId: '5758de7d-227b-42db-9db6-a52f7b550da4',
      title: 'Full Stack Software Engineer',
      company: 'WebMakers Inc.',
      location: 'Remote',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Develop and maintain dynamic web applications, working on both the React frontend and the Node.js/Express backend.',
      requirements: ['3+ years experience with React and Node.js', 'Strong understanding of RESTful APIs', 'Proficiency in SQL or NoSQL databases', 'Experience with Git version control'],
      salary: '$115,000',
      salaryRange: '$100,000 - $130,000',
      experienceLevel: 'Mid Level',
      phoneNumbers: ['+1 415-555-0198'],
      emails: ['jobs@webmakers.io'],
      expiresAt: new Date('2026-09-15'),
    },
    {
      id: '92dde73c-d9a0-4da4-9d87-db242a8abbc6',
      careerPathId: '45018e79-074b-4c4d-bf01-9b4420e735a0',
      title: 'Product / UX Designer',
      company: 'Creative App Studios',
      location: 'Los Angeles, CA',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Conduct user research, create wireframes and high-fidelity prototypes, and collaborate with developers to deliver intuitive mobile apps.',
      requirements: ['Portfolio demonstrating end-to-end design process', 'Proficiency in Figma or Sketch', 'Experience conducting user testing', 'Understanding of accessibility standards'],
      salary: '$105,000',
      salaryRange: '$90,000 - $120,000',
      experienceLevel: 'Mid Level',
      phoneNumbers: ['+1 310-555-0234', '+1 310-555-0235'],
      emails: ['design-jobs@creativeapp.com', 'hr@creativeapp.com'],
      expiresAt: new Date('2026-12-01'),
    },
    {
      id: '9d793fa0-8e6b-49eb-91fe-fec7daaee016',
      careerPathId: 'dc232900-e183-483c-ae52-6a9836d7803a',
      title: 'Senior AI Engineer',
      company: 'NextGen AI Solutions',
      location: 'San Francisco, CA',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Lead the development of our core natural language processing models and optimize machine learning pipelines for scale.',
      requirements: ['5+ years experience in ML/AI', 'Expertise in PyTorch and TensorFlow', 'Strong Python skills', 'Experience with Natural Language Processing'],
      salary: '$160,000',
      salaryRange: '$140,000 - $180,000',
      experienceLevel: 'Senior Level',
      phoneNumbers: ['+1 415-555-0789'],
      emails: ['ai-careers@nextgen.ai', 'talent@nextgen.ai'],
      expiresAt: new Date('2026-11-30'),
    },
    {
      id: 'bfce7906-1ca1-4145-be89-56f754545b9f',
      careerPathId: '5d387949-c6d6-45c1-b90b-15d873907e21',
      title: 'QA Automation Engineer',
      company: 'Reliant Software Solutions',
      location: 'Remote / Dallas, TX',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Write and execute automated test scripts, perform regression testing, and track bugs to ensure high-quality software releases.',
      requirements: ['Experience with Selenium or Cypress', 'Understanding of the SDLC and Agile methodologies', 'Basic programming skills in Python or Java', 'Strong attention to detail'],
      salary: '$95,000',
      salaryRange: '$85,000 - $110,000',
      experienceLevel: 'Entry Level',
      phoneNumbers: ['+1 214-555-0456'],
      emails: ['qa-jobs@reliantsoft.com'],
      expiresAt: new Date('2026-10-20'),
    },
    {
      id: 'ce2e9f2c-918f-4234-99bc-b1af4089706f',
      careerPathId: '27a9d6a8-00d9-4f73-bf69-ec8635c383a9',
      title: 'DevOps Automation Engineer',
      company: 'TechFlow Systems',
      location: 'Boston, MA',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Build and maintain CI/CD pipelines, automate infrastructure deployment using Terraform, and monitor system performance.',
      requirements: ['Experience with Jenkins, GitLab CI, or GitHub Actions', 'Proficiency in Docker and Kubernetes', 'Strong scripting skills (Python/Bash)', 'Experience with infrastructure as code'],
      salary: '$135,000',
      salaryRange: '$120,000 - $150,000',
      experienceLevel: 'Mid Level',
      phoneNumbers: ['+1 617-555-0567', '+1 617-555-0568'],
      emails: ['devops@techflow.com', 'careers@techflow.com'],
      expiresAt: new Date('2026-11-15'),
    },
    {
      id: 'e4894a23-3993-493d-a72e-bc4b92747183',
      careerPathId: 'b97c7a14-d029-44a1-8a46-d50fca0988c2',
      title: 'Lead Cloud Architect',
      company: 'CloudScale Innovations',
      location: 'Remote / Seattle, WA',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Design and oversee the migration of enterprise applications to AWS, ensuring high availability, security, and cost-efficiency.',
      requirements: ['AWS Certified Solutions Architect - Professional', '7+ years in IT infrastructure', 'Experience with Kubernetes and microservices', 'Strong leadership and communication skills'],
      salary: '$145,000',
      salaryRange: '$130,000 - $160,000',
      experienceLevel: 'Senior Level',
      phoneNumbers: ['+1 206-555-0678'],
      emails: ['cloud-roles@cloudscale.io'],
      expiresAt: new Date('2026-10-01'),
    },
    {
      id: 'e788dc83-f4f9-4b43-b133-0bbc5379fa21',
      careerPathId: 'fedd04dc-bbe1-4a55-8246-ddfd3d60be32',
      title: 'Cybersecurity Analyst',
      company: 'SecureNet Financial',
      location: 'New York, NY',
      type: JobType.FULL_TIME,
      status: JobStatus.ACTIVE,
      description: 'Monitor network traffic for security breaches, investigate violations, and implement security protocols to protect sensitive financial data.',
      requirements: ['CompTIA Security+ or CISSP certification', 'Experience with SIEM tools', 'Knowledge of network security protocols', 'Strong analytical and troubleshooting skills'],
      salary: '$120,000',
      salaryRange: '$110,000 - $135,000',
      experienceLevel: 'Mid Level',
      phoneNumbers: ['+1 212-555-0890', '+1 212-555-0891'],
      emails: ['security-jobs@securenet.com', 'recruitment@securenet.com'],
      expiresAt: new Date('2026-09-30'),
    },
  ]

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: job,
      create: job,
    })
    console.log(`✅ Created job posting: ${job.title}`)

    // Queue embedding generation job for job posting
    await redisClient.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `job_${job.id}`,
      job_type: 'job_embedding',
      job_id_field: job.id,
    }))
    console.log(`📤 Queued embedding job for job: ${job.title}`)
  }

  // Seed skills from skill_model.py
  const techSkills = [
    // Programming Languages
    'python', 'java', 'core java', 'java se', 'java ee', 'j2ee',
    'javascript', 'typescript', 'c', 'c++', 'c#',
    'go', 'golang', 'rust', 'ruby', 'php',
    'swift', 'kotlin', 'dart', 'r', 'matlab',
    // Frontend
    'html', 'css', 'sass', 'bootstrap', 'tailwind css',
    'javascript', 'jquery',
    'react', 'reactjs', 'next.js', 'nextjs',
    'angular', 'angularjs',
    'vue', 'vue.js', 'vuejs',
    'redux', 'vite',
    // Backend
    'node.js', 'nodejs',
    'express', 'express.js',
    'nestjs', 'nest.js',
    'django', 'flask', 'fastapi',
    'spring', 'spring boot',
    'asp.net', '.net', '.net core',
    'laravel', 'codeigniter',
    'graphql', 'rest api', 'restful api',
    'grpc', 'microservices',
    // Mobile
    'flutter', 'react native',
    'android', 'android studio',
    'ios', 'xcode',
    // Databases
    'sql', 'nosql',
    'mysql', 'postgresql',
    'sqlite', 'sql server', 'mssql',
    'oracle', 'mongodb',
    'redis', 'firebase',
    'supabase', 'cassandra',
    'elasticsearch', 'snowflake',
    'bigquery',
    // Cloud
    'aws', 'azure', 'gcp',
    'ec2', 'lambda', 's3',
    'cloudfront', 'eks', 'ecs',
    // DevOps
    'docker', 'docker compose',
    'kubernetes', 'helm',
    'terraform', 'ansible',
    'jenkins', 'github actions',
    'gitlab ci', 'argocd',
    'prometheus', 'grafana',
    'nginx',
    // Version Control
    'git', 'github', 'gitlab', 'bitbucket',
    // Operating Systems
    'linux', 'ubuntu',
    'windows server',
    'bash', 'shell', 'powershell',
    // Data Engineering
    'hadoop', 'spark',
    'kafka', 'airflow',
    // AI / ML
    'machine learning',
    'deep learning',
    'artificial intelligence',
    'nlp',
    'computer vision',
    'data science',
    'tensorflow',
    'pytorch',
    'keras',
    'scikit-learn',
    'pandas',
    'numpy',
    'opencv',
    'yolo',
    'openvino',
    'hugging face',
    'transformers',
    'langchain',
    'llamaindex',
    'rag',
    'ollama',
    'faiss',
    'chromadb',
    'pinecone',
    'milvus',
    // Security
    'cybersecurity',
    'penetration testing',
    'burp suite',
    'wireshark',
    'metasploit',
    'nmap',
    'kali linux',
    // Testing
    'unit testing',
    'integration testing',
    'selenium',
    'pytest',
    'jest',
    'postman',
    // Tools
    'jira',
    'confluence',
    'figma',
    'canva',
    'photoshop',
    'illustrator',
    'adobe xd',
    'power bi',
    'tableau',
    'excel',
    'word',
    'powerpoint',
    // Methodologies
    'agile',
    'scrum',
    'kanban',
    'devops',
    // Other
    'oauth',
    'jwt',
    'socket.io',
    'rabbitmq',
    'blockchain',
    'web3'
  ]

  const softSkills = [
    'communication',
    'verbal communication',
    'written communication',
    'presentation',
    'public speaking',
    'leadership',
    'teamwork',
    'collaboration',
    'interpersonal skills',
    'problem solving',
    'critical thinking',
    'analytical thinking',
    'decision making',
    'time management',
    'project management',
    'organizational skills',
    'adaptability',
    'flexibility',
    'fast learner',
    'continuous learning',
    'creativity',
    'innovation',
    'attention to detail',
    'work ethic',
    'self motivated',
    'self management',
    'initiative',
    'responsibility',
    'accountability',
    'multitasking',
    'stress management',
    'customer service',
    'client relationship',
    'active listening',
    'negotiation',
    'conflict resolution',
    'mentoring',
    'coaching',
    'emotional intelligence',
    'empathy',
    'networking',
    'hard working',
    'punctual',
    'organized'
  ]

  // Seed technical skills
  for (const skillName of techSkills) {
    const displayName = skillName.charAt(0).toUpperCase() + skillName.slice(1)
    const skill = await prisma.skill.upsert({
      where: { name: displayName },
      update: {},
      create: {
        name: displayName,
        category: 'TECHNICAL',
        description: `${displayName} - Technical skill`,
        difficulty: 'INTERMEDIATE',
        active: true,
      },
    })

    // Queue embedding generation job for skill
    await redisClient.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `skill_${skill.id}`,
      job_type: 'skill_embedding',
      skill_id: skill.id,
    }))
  }
  console.log(`✅ Seeded ${techSkills.length} technical skills`)

  // Seed soft skills
  for (const skillName of softSkills) {
    const displayName = skillName.charAt(0).toUpperCase() + skillName.slice(1)
    const skill = await prisma.skill.upsert({
      where: { name: displayName },
      update: {},
      create: {
        name: displayName,
        category: 'SOFT',
        description: `${displayName} - Soft skill`,
        difficulty: 'INTERMEDIATE',
        active: true,
      },
    })

    // Queue embedding generation job for skill
    await redisClient.lPush('ai_jobs_queue', JSON.stringify({
      job_id: `skill_${skill.id}`,
      job_type: 'skill_embedding',
      skill_id: skill.id,
    }))
  }
  console.log(`✅ Seeded ${softSkills.length} soft skills`)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    if (redisClient.isOpen) {
      await redisClient.quit()
      console.log('✅ Disconnected from Redis')
    }
  })
