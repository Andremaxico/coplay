import { createGame } from '@/app/actions/games'
import { Input } from '@/UI/Input/Input'
import { Select } from '@/UI/Select/Select'
import { Button } from '@/UI/Button/Button'
import styles from './page.module.scss'

export default function NewGamePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Створити гру</h1>
      
      <form action={createGame} className={styles.form}>
        <Input 
          label="Назва гри"
          type="text" 
          name="title" 
          required 
          placeholder="Наприклад: Вечірній футбол на Ратаях" 
        />
        
        <Select label="Вид спорту" name="sport_type" required>
          <option value="football">Футбол</option>
          <option value="basketball">Баскетбол</option>
          <option value="volleyball">Волейбол</option>
          <option value="tennis">Теніс</option>
          <option value="other">Інше</option>
        </Select>
        
        <Input 
          label="Місце проведення"
          type="text" 
          name="location_text" 
          required 
          placeholder="Наприклад: Орлик на Ратаях" 
        />
        
        <Input 
          label="Час початку"
          type="datetime-local" 
          name="starts_at" 
          required 
        />
        
        <Input 
          label="Максимальна кількість учасників"
          type="number" 
          name="max_participants" 
          required 
          min="2" 
          placeholder="Наприклад: 10" 
        />
        
        <label className={styles.checkboxField}>
          <input 
            type="checkbox" 
            name="is_public" 
            value="true" 
            defaultChecked 
            className={styles.checkbox} 
          />
          Публічна гра (видно всім)
        </label>
        
        <Button type="submit" variant="secondary" className={styles.submitBtn}>
          Створити
        </Button>
      </form>
    </div>
  )
}
