import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CheckAuth({ children, protectedRoute }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (protectedRoute) {
      if (!token) {
        navigate("/login");
      } else {
        if (location.pathname === "/admin" && userRole !== "admin") {
          navigate("/login");
        } else {
          setLoading(false);
        }
      }
    } else {
      if (token) {
        navigate("/");
      } else {
        setLoading(false);
      }
    }
  }, [navigate, protectedRoute, location.pathname]);

  if (loading) {
    return <div>loading...</div>;
  }
  return children;
}

export default CheckAuth;