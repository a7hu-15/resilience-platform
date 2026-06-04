from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    test_runs = db.relationship('TestRun', backref='user', lazy=True)


class TestRun(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    docker_images = db.Column(db.String(500), nullable=False)  # comma-separated
    overall_scores = db.Column(db.String(500), nullable=False)  # comma-separated scores
    grades = db.Column(db.String(200), nullable=False)          # comma-separated grades
    ran_at = db.Column(db.DateTime, default=datetime.utcnow)
