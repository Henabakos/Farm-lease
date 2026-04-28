import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const multiClusterService = {
  // User clusters
  getUserClusters: async () => {
    const { data } = await axios.get(`${API_URL}/multi-cluster/my-clusters`);
    return data;
  },

  // Members
  getClusterMembers: async (clusterId: string) => {
    const { data } = await axios.get(`${API_URL}/multi-cluster/${clusterId}/members`);
    return data;
  },

  inviteUser: async (clusterId: string, email: string, role: string) => {
    const { data } = await axios.post(`${API_URL}/multi-cluster/${clusterId}/invite`, {
      email,
      role
    });
    return data;
  },

  acceptInvitation: async (clusterId: string, token: string) => {
    const { data } = await axios.post(
      `${API_URL}/multi-cluster/${clusterId}/accept-invitation/${token}`
    );
    return data;
  },

  // Permissions
  getPermissions: async (clusterId: string) => {
    const { data } = await axios.get(`${API_URL}/multi-cluster/${clusterId}/permissions`);
    return data;
  },

  updateUserRole: async (clusterId: string, userId: string, role: string) => {
    const { data } = await axios.put(
      `${API_URL}/multi-cluster/${clusterId}/members/${userId}/role`,
      { role }
    );
    return data;
  },

  removeMember: async (clusterId: string, userId: string) => {
    const { data } = await axios.delete(`${API_URL}/multi-cluster/${clusterId}/members/${userId}`);
    return data;
  },

  updatePermissions: async (clusterId: string, userId: string, permissions: any) => {
    const { data } = await axios.put(
      `${API_URL}/multi-cluster/${clusterId}/permissions/${userId}`,
      permissions
    );
    return data;
  },

  // Cluster actions
  leaveCluster: async (clusterId: string) => {
    const { data } = await axios.post(`${API_URL}/multi-cluster/${clusterId}/leave`);
    return data;
  },

  getClusterStats: async (clusterId: string) => {
    const { data } = await axios.get(`${API_URL}/multi-cluster/${clusterId}/stats`);
    return data;
  }
};
