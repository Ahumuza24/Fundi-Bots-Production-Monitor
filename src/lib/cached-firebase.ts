import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withCache, CACHE_KEYS, CACHE_TTL, createCacheKey } from '@/lib/cache';

// Cached collection fetcher
export const getCachedCollection = withCache(
  async (collectionName: string, constraints: QueryConstraint[] = []) => {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  (collectionName: string, constraints: QueryConstraint[] = []) => 
    createCacheKey(`collection_${collectionName}`, { 
      constraints: constraints.map(c => c.toString()).join(',') 
    }),
  CACHE_TTL.MEDIUM
);

// Cached document fetcher
export const getCachedDocument = withCache(
  async (collectionName: string, docId: string) => {
    const docRef = doc(db, collectionName, docId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`Document ${docId} not found in ${collectionName}`);
    }
    return { id: snapshot.id, ...snapshot.data() };
  },
  (collectionName: string, docId: string) => 
    createCacheKey(`doc_${collectionName}`, { id: docId }),
  CACHE_TTL.LONG
);

// Cached projects fetcher
export const getCachedProjects = withCache(
  async (userId: string) => {
    return getCachedCollection('projects', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    ]);
  },
  (userId: string) => createCacheKey(CACHE_KEYS.PROJECTS, { userId }),
  CACHE_TTL.MEDIUM
);

// Cached workers fetcher
export const getCachedWorkers = withCache(
  async (userId: string) => {
    return getCachedCollection('workers', [
      where('userId', '==', userId),
      orderBy('name', 'asc')
    ]);
  },
  (userId: string) => createCacheKey(CACHE_KEYS.WORKERS, { userId }),
  CACHE_TTL.MEDIUM
);

// Cached project details
export const getCachedProjectDetails = withCache(
  async (projectId: string) => {
    return getCachedDocument('projects', projectId);
  },
  (projectId: string) => createCacheKey(CACHE_KEYS.PROJECT_DETAILS, { projectId }),
  CACHE_TTL.LONG
);

// Cached worker details
export const getCachedWorkerDetails = withCache(
  async (workerId: string) => {
    return getCachedDocument('workers', workerId);
  },
  (workerId: string) => createCacheKey(CACHE_KEYS.WORKER_DETAILS, { workerId }),
  CACHE_TTL.LONG
);

// Cached dashboard stats
export const getCachedDashboardStats = withCache(
  async (userId: string) => {
    const [projects, workers] = await Promise.all([
      getCachedProjects(userId),
      getCachedWorkers(userId)
    ]);

    const activeProjects = projects.filter((p: any) => p.status === 'active');
    const completedProjects = projects.filter((p: any) => p.status === 'completed');
    const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
    const activeWorkers = workers.filter((w: any) => w.status === 'active');

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalWorkers: workers.length,
      activeWorkers: activeWorkers.length,
      totalBudget,
      recentProjects: projects.slice(0, 5),
      recentWorkers: workers.slice(0, 5)
    };
  },
  (userId: string) => createCacheKey(CACHE_KEYS.DASHBOARD_STATS, { userId }),
  CACHE_TTL.SHORT // Shorter TTL for dashboard stats
);

// Cached recent activities
export const getCachedRecentActivities = withCache(
  async (userId: string, limitCount: number = 10) => {
    return getCachedCollection('activities', [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ]);
  },
  (userId: string, limitCount: number = 10) => 
    createCacheKey(CACHE_KEYS.RECENT_ACTIVITIES, { userId, limit: limitCount }),
  CACHE_TTL.SHORT
);

// Cached report data
export const getCachedReportData = withCache(
  async (userId: string, dateRange: { start: Date; end: Date }) => {
    const projects = await getCachedProjects(userId);
    const workers = await getCachedWorkers(userId);
    
    // Filter by date range
    const filteredProjects = projects.filter((p: any) => {
      const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
      return createdAt >= dateRange.start && createdAt <= dateRange.end;
    });

    // Calculate report metrics
    const projectsByStatus = filteredProjects.reduce((acc: any, project: any) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    const budgetByMonth = filteredProjects.reduce((acc: any, project: any) => {
      const month = new Date(project.createdAt?.toDate?.() || project.createdAt).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + (project.budget || 0);
      return acc;
    }, {});

    return {
      projects: filteredProjects,
      workers,
      projectsByStatus,
      budgetByMonth,
      totalBudget: filteredProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0),
      averageBudget: filteredProjects.length > 0 
        ? filteredProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0) / filteredProjects.length 
        : 0
    };
  },
  (userId: string, dateRange: { start: Date; end: Date }) => 
    createCacheKey(CACHE_KEYS.REPORT_DATA, { 
      userId, 
      start: dateRange.start.toISOString(), 
      end: dateRange.end.toISOString() 
    }),
  CACHE_TTL.MEDIUM
);